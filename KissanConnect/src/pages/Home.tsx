import React, { useState, useEffect } from 'react';
import { MapPin, Edit2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import * as L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import { auth, db } from "./config/config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { Feature, FeatureCollection, Geometry } from "geojson";
import { GeoJSON } from 'react-leaflet';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Drawing Controls Component
function DrawingControls() {
  const map = useMap();

  useEffect(() => {
    map.pm.addControls({
      position: 'topleft',
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawMarker: false,
      cutPolygon: false,
    });

    map.on('pm:create', (e) => {
      const layer = (e.layer as L.Polygon);
      const type = e.shape;
      const coordinates = layer.toGeoJSON().geometry.coordinates;
      
      const propertyType = type === 'Rectangle' ? 'plot' : 'building';
      const event = new CustomEvent('propertyDrawn', {
        detail: { coordinates, propertyType, layer }
      });
      window.dispatchEvent(event);
    });

    return () => {
      map.pm.removeControls();
      map.off('pm:create');
    };
  }, [map]);

  return null;
}

interface Property {
  id: string;
  position: [number, number];
  owner: string;
  address: string;
  propertyType: string;
  floors?: number;
  yearBuilt?: number;
  squareFootage: number;
  plot?: {
    type: string;
    properties: { owner: string };
    geometry: { type: string; coordinates: any }; // Will be parsed from string
  };
  building?: {
    type: string;
    properties: { owner: string };
    geometry: { type: string; coordinates: any }; // Will be parsed from string
  };
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<any>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    owner: '',
    address: '',
    propertyType: '',
    floors: '',
    yearBuilt: '',
    squareFootage: ''
  });
  const [error, setError] = useState<string | null>(null);

  // Auth state management and fetch properties
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchProperties(currentUser.uid);
      } else {
        setProperties([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch properties from Firestore
  const fetchProperties = async (uid: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, `users/${uid}/properties`));
      const propertiesData: Property[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Parse coordinates if they were stringified
        if (data.plot?.geometry?.coordinates) {
          data.plot.geometry.coordinates = JSON.parse(data.plot.geometry.coordinates);
        }
        if (data.building?.geometry?.coordinates) {
          data.building.geometry.coordinates = JSON.parse(data.building.geometry.coordinates);
        }
        return {
          id: doc.id,
          ...data
        } as Property;
      });
      setProperties(propertiesData);
      setError(null);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setError("Failed to load properties. Please try again.");
    }
  };

  // Property drawing event listener
  useEffect(() => {
    const handlePropertyDrawn = (e: any) => {
      setCurrentDrawing({
        coordinates: e.detail.coordinates,
        propertyType: e.detail.propertyType,
        layer: e.detail.layer
      });
      setShowForm(true);
      setEditingProperty(null);
    };

    window.addEventListener('propertyDrawn', handlePropertyDrawn);
    return () => window.removeEventListener('propertyDrawn', handlePropertyDrawn);
  }, []);

  // Edit property event listener
  useEffect(() => {
    const handleEditProperty = (e: any) => {
      const property = properties.find(p => p.id === e.detail.propertyId);
      if (property) handleEdit(property);
    };
    window.addEventListener('editProperty', handleEditProperty);
    return () => window.removeEventListener('editProperty', handleEditProperty);
  }, [properties]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      owner: property.owner,
      address: property.address,
      propertyType: property.propertyType,
      floors: property.floors?.toString() || '',
      yearBuilt: property.yearBuilt?.toString() || '',
      squareFootage: property.squareFootage.toString()
    });
    setShowForm(true);
    setCurrentDrawing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const floors = formData.floors ? parseInt(formData.floors) : undefined;
    const yearBuilt = formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined;
    const squareFootage = parseInt(formData.squareFootage);

    if (!user) return;

    try {
      if (editingProperty) {
        const propertyRef = doc(db, `users/${user.uid}/properties`, editingProperty.id);
        const updatedData = {
          owner: formData.owner,
          address: formData.address,
          propertyType: formData.propertyType,
          floors,
          yearBuilt,
          squareFootage,
          // Preserve plot/building data if it exists, no coordinates change on edit
          ...(editingProperty.plot && { plot: editingProperty.plot }),
          ...(editingProperty.building && { building: editingProperty.building })
        };
        await updateDoc(propertyRef, updatedData);
        const updatedProperties = properties.map(prop =>
          prop.id === editingProperty.id
            ? { ...prop, ...formData, floors, yearBuilt, squareFootage }
            : prop
        );
        setProperties(updatedProperties);
      } else if (currentDrawing) {
        const newProperty: Property = {
          id: '',
          position: [
            currentDrawing.coordinates[0][0][1],
            currentDrawing.coordinates[0][0][0]
          ],
          owner: formData.owner,
          address: formData.address,
          propertyType: formData.propertyType,
          floors,
          yearBuilt,
          squareFootage
        };

        if (currentDrawing.propertyType === 'plot') {
          newProperty.plot = {
            type: "Feature",
            properties: { owner: formData.owner },
            geometry: {
              type: "Polygon",
              coordinates: JSON.stringify(currentDrawing.coordinates) // Stringify coordinates
            }
          };
        } else {
          newProperty.building = {
            type: "Feature",
            properties: { owner: formData.owner },
            geometry: {
              type: "Polygon",
              coordinates: JSON.stringify(currentDrawing.coordinates) // Stringify coordinates
            }
          };
        }

        const docRef = await addDoc(collection(db, `users/${user.uid}/properties`), newProperty);
        newProperty.id = docRef.id;
        // Parse coordinates back to array for local state
        if (newProperty.plot) newProperty.plot.geometry.coordinates = currentDrawing.coordinates;
        if (newProperty.building) newProperty.building.geometry.coordinates = currentDrawing.coordinates;
        setProperties([...properties, newProperty]);
        currentDrawing.layer.remove();
      }

      setShowForm(false);
      setFormData({
        owner: '',
        address: '',
        propertyType: '',
        floors: '',
        yearBuilt: '',
        squareFootage: ''
      });
      setEditingProperty(null);
      setCurrentDrawing(null);
      setError(null);
    } catch (error) {
      console.error("Error saving property:", error);
      setError("Failed to save property. Please try again.");
    }
  };


  const plotStyle = {
    weight: 2,
    opacity: 1,
    color: '#3b82f6',
    fillOpacity: 0.2,
    fillColor: '#60a5fa'
  };

  const buildingStyle = {
    weight: 2,
    opacity: 1,
    color: '#dc2626',
    fillOpacity: 0.4,
    fillColor: '#ef4444'
  };

  return (
    <div className="min-h-screen bg-green-200">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-2xl font-bold text-gray-900">Kissan Property Map</h1>
          </div>
          <div>

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-[70vh] z-0 relative" style={{ height: "500px", width: "100%" }}>
            <MapContainer
              center={[40.7128, -74.0060]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <DrawingControls />
              {properties.map((property) => (
                <React.Fragment key={property.id}>
                  {property.plot && (
                    <GeoJSON 
                      data={property.plot as GeoJSON.Feature} 
                      style={plotStyle}
                      onEachFeature={(feature, layer) => {
                        layer.bindPopup(`
                          <div class="p-2">
                            <h3 class="font-bold text-lg">${property.owner}'s Property</h3>
                            <p class="text-sm text-gray-600">${property.address}</p>
                            <p class="text-sm text-gray-500">${property.propertyType}</p>
                            <p class="text-sm text-gray-500">Total Area: ${property.squareFootage} sq ft</p>
                            <button
                              onclick="window.handlePropertyEdit('${property.id}')"
                              class="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                            >
                              Edit Property
                            </button>
                          </div>
                        `);
                      }}
                    />
                  )}
                  {property.building && (
                    <GeoJSON 
                    data={property.plot as GeoJSON.Feature} 
                    style={buildingStyle}
                      onEachFeature={(feature, layer) => {
                        layer.bindPopup(`
                          <div class="p-2">
                            <h3 class="font-bold text-lg">${property.propertyType}</h3>
                            <p class="text-sm text-gray-600">Owner: ${property.owner}</p>
                            <p class="text-sm text-gray-500">Floors: ${property.floors || 'N/A'}</p>
                            <p class="text-sm text-gray-500">Year Built: ${property.yearBuilt || 'N/A'}</p>
                            <p class="text-sm text-gray-500">Area: ${property.squareFootage} sq ft</p>
                            <button
                              onclick="window.handlePropertyEdit('${property.id}')"
                              class="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                            >
                              Edit Property
                            </button>
                          </div>
                        `);
                      }}
                    />
                  )}
                  <Marker
                    position={property.position}
                    icon={DefaultIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-lg">{property.owner}</h3>
                        <p className="text-sm text-gray-600">{property.address}</p>
                        <p className="text-sm text-gray-500">{property.propertyType}</p>
                        <button
                          onClick={() => handleEdit(property)}
                          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" /> Edit Property
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}
            </MapContainer>
          </div>

          <div className="p-4 border-t">
            <h2 className="text-lg font-semibold mb-2">Drawing Instructions</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Use the drawing tools on the left to create plots (rectangle) or buildings (polygon).</p>
              <p>Click on markers to view/edit property details.</p>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {editingProperty ? 'Edit Property Details' : 
                  currentDrawing?.propertyType === 'plot' ? 'Add Property Details' : 'Add Building Details'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                  <input
                    type="text"
                    value={formData.owner}
                    onChange={(e) => setFormData({...formData, owner: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property Type</label>
                  <input
                    type="text"
                    value={formData.propertyType}
                    onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Floors</label>
                  <input
                    type="number"
                    value={formData.floors}
                    onChange={(e) => setFormData({...formData, floors: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year Built</label>
                  <input
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => setFormData({...formData, yearBuilt: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Square Footage</label>
                  <input
                    type="number"
                    value={formData.squareFootage}
                    onChange={(e) => setFormData({...formData, squareFootage: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingProperty(null);
                      if (!editingProperty && currentDrawing?.layer) {
                        currentDrawing.layer.remove();
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingProperty ? 'Save Changes' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

if (typeof window !== 'undefined') {
  (window as any).handlePropertyEdit = (propertyId: string) => {
    const event = new CustomEvent('editProperty', { detail: { propertyId } });
    window.dispatchEvent(event);
  };
}

export default App;