import React, { useState, useEffect } from "react";
import { MapPin, Edit2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import * as L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import { auth, db } from "./config/config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { Feature } from "geojson";
import { GeoJSON } from 'react-leaflet';
import { User } from "firebase/auth";
import Web3 from "web3";
import { mintNFt } from "../App";

// Augment Window interface to include handlePropertyEdit
declare global {
  interface Window {
    handlePropertyEdit: (propertyId: string) => void;
  }
}

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
    geometry: { type: string; coordinates: any };
  };
  building?: {
    type: string;
    properties: { owner: string };
    geometry: { type: string; coordinates: any };
  };
}

interface Drawing {
  coordinates: number[][][];
  propertyType: string;
  layer: L.Layer;
}

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
    map.on('pm:create', (e: L.LeafletEvent) => {
      const layer = e.layer as L.Polygon;
      const type = layer.pm.getShape() || 'Polygon';
      const coordinates = layer.toGeoJSON().geometry.coordinates as number[][][];
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

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showHashPopup, setShowHashPopup] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    owner: '',
    address: '',
    propertyType: '',
    floors: '',
    yearBuilt: '',
    squareFootage: '',
    secretKey: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [inputFocus, setInputFocus] = useState<{ [key: string]: boolean }>({});
  const [buttonHover, setButtonHover] = useState<{ [key: string]: boolean }>({});

  const web3 = new Web3();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        fetchProperties(currentUser.uid);
      } else {
        setProperties([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProperties = async (uid: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, `users/${uid}/properties`));
      const propertiesData = querySnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Property, 'id'>;
        if (data.plot?.geometry?.coordinates) {
          data.plot.geometry.coordinates = typeof data.plot.geometry.coordinates === 'string'
            ? JSON.parse(data.plot.geometry.coordinates)
            : data.plot.geometry.coordinates;
        }
        if (data.building?.geometry?.coordinates) {
          data.building.geometry.coordinates = typeof data.building.geometry.coordinates === 'string'
            ? JSON.parse(data.building.geometry.coordinates)
            : data.building.geometry.coordinates;
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

  useEffect(() => {
    const handlePropertyDrawn = (e: CustomEvent<{ coordinates: number[][][]; propertyType: string; layer: L.Layer }>) => {
      setCurrentDrawing({
        coordinates: e.detail.coordinates,
        propertyType: e.detail.propertyType,
        layer: e.detail.layer
      });
      setShowForm(true);
      setEditingProperty(null);
    };
    window.addEventListener('propertyDrawn', handlePropertyDrawn as EventListener);
    return () => window.removeEventListener('propertyDrawn', handlePropertyDrawn as EventListener);
  }, []);

  useEffect(() => {
    const handleEditProperty = (e: CustomEvent<{ propertyId: string }>) => {
      const property = properties.find(p => p.id === e.detail.propertyId);
      if (property) handleEdit(property);
    };
    window.addEventListener('editProperty', handleEditProperty as EventListener);
    return () => window.removeEventListener('editProperty', handleEditProperty as EventListener);
  }, [properties]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      owner: property.owner || '',
      address: property.address || '',
      propertyType: property.propertyType || '',
      floors: property.floors?.toString() || '',
      yearBuilt: property.yearBuilt?.toString() || '',
      squareFootage: property.squareFootage?.toString() || '',
      secretKey: ''
    });
    setShowForm(true);
    setCurrentDrawing(null);
  };

  const validateSecretKey = (key: string): boolean => {
    const regex = /^[a-zA-Z0-9@#$%^&*()_+\-=\[\]{}|;:,.<>?]{8,32}$/;
    return regex.test(key);
  };

  const computeHash = () => {
    const { owner, address, propertyType, floors, yearBuilt, squareFootage, secretKey } = formData;
    if (!validateSecretKey(secretKey)) {
      throw new Error("Invalid secret key. Must be 8–32 characters, alphanumeric or common special characters.");
    }
    const dataString = `${owner}|${address}|${propertyType}|${floors}|${yearBuilt}|${squareFootage}|${secretKey}`;
    return web3.utils.sha3(dataString);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const floors = formData.floors ? parseInt(formData.floors) : undefined;
    const yearBuilt = formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined;
    const squareFootage = parseInt(formData.squareFootage);
    if (!user) {
      setError("You must be logged in to save a property.");
      return;
    }
    try {
      const hash = computeHash();
      let docRef;
      if (editingProperty) {
        const propertyRef = doc(db, `users/${user.uid}/properties`, editingProperty.id);
        const updatedData = {
          owner: formData.owner,
          address: formData.address,
          propertyType: formData.propertyType,
          floors,
          yearBuilt,
          squareFootage,
          ...(editingProperty.plot && {
            plot: {
              ...editingProperty.plot,
              geometry: {
                ...editingProperty.plot.geometry,
                coordinates: JSON.stringify(editingProperty.plot.geometry.coordinates)
              }
            }
          }),
          ...(editingProperty.building && {
            building: {
              ...editingProperty.building,
              geometry: {
                ...editingProperty.building.geometry,
                coordinates: JSON.stringify(editingProperty.building.geometry.coordinates)
              }
            }
          })
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
              coordinates: JSON.stringify(currentDrawing.coordinates)
            }
          };
        } else {
          newProperty.building = {
            type: "Feature",
            properties: { owner: formData.owner },
            geometry: {
              type: "Polygon",
              coordinates: JSON.stringify(currentDrawing.coordinates)
            }
          };
        }
        docRef = await addDoc(collection(db, `users/${user.uid}/properties`), newProperty);
        newProperty.id = docRef.id;
        if (newProperty.plot) newProperty.plot.geometry.coordinates = currentDrawing.coordinates;
        if (newProperty.building) newProperty.building.geometry.coordinates = currentDrawing.coordinates;
        setProperties([...properties, newProperty]);
        currentDrawing.layer.remove();
      }
      // Convert hash to Buffer using hex encoding
      const hashBuffer = Buffer.from(hash!.replace(/^0x/, ''), 'hex');
      const txHash = await mintNFt(hashBuffer.toString('hex')); // Pass hex string to mintNFt
      setTransactionHash(txHash);
      setShowHashPopup(true);
      setShowForm(false);
      setFormData({
        owner: '',
        address: '',
        propertyType: '',
        floors: '',
        yearBuilt: '',
        squareFootage: '',
        secretKey: ''
      });
      setEditingProperty(null);
      setCurrentDrawing(null);
      setError(null);
    } catch (error: any) {
      console.error("Error saving property:", error);
      setError(error.message || "Failed to save property. Please check your input and try again.");
    }
  };

  const plotStyle = {
    weight: 2,
    opacity: 1,
    color: '#6b8e6b',
    fillOpacity: 0.2,
    fillColor: '#a3bffa'
  };

  const buildingStyle = {
    weight: 2,
    opacity: 1,
    color: '#558855',
    fillOpacity: 0.4,
    fillColor: '#c6e2c6'
  };

  const inputBaseStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #e8f5e8',
    background: '#f0fff0',
    fontSize: '0.875rem',
    color: '#2f4f2f',
    transition: 'all 0.2s',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  };

  const inputFocusStyle = {
    borderColor: '#6b8e6b',
    boxShadow: '0 0 0 3px rgba(107, 142, 107, 0.3)'
  };

  const buttonBaseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: '#6b8e6b',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const buttonHoverStyle = {
    background: '#558855',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
  };

  const cancelButtonBaseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: '1px solid #e8f5e8',
    background: '#f0fff0',
    color: '#4a704a',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const cancelButtonHoverStyle = {
    background: '#e8f5e8'
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #c6e2c6,rgb(124, 154, 171))', minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {error && (
        <div style={{
          background: '#ffebee',
          color: '#c0392b',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #ef9a9a',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {error}
        </div>
      )}
      <div style={{ position: 'relative', flex: 1, border: '2px solid #e8f5e8', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <MapContainer
          center={[40.7128, -74.0060]}
          zoom={15}
          style={{ height: '70vh', width: '100%', zIndex: 1 }}
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
                  data={property.plot as Feature}
                  style={plotStyle}
                  onEachFeature={(feature, layer) => {
                    layer.bindPopup(`
                      <div style="padding: 0.5rem; font-family: Arial, sans-serif;">
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #2f4f2f;">${property.owner}'s Property</h3>
                        <p style="font-size: 0.875rem; color: #4a704a;">${property.address}</p>
                        <p style="font-size: 0.875rem; color: #6b8e6b;">${property.propertyType}</p>
                        <p style="font-size: 0.875rem; color: #6b8e6b;">Total Area: ${property.squareFootage} sq ft</p>
                        <button
                          onclick="window.handlePropertyEdit('${property.id}')"
                          style="margin-top: 0.5rem; padding: 0.375rem 0.75rem; background: #6b8e6b; color: white; border: none; border-radius: 4px; font-size: 0.875rem; cursor: pointer; transition: background 0.2s;"
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
                  data={property.building as Feature}
                  style={buildingStyle}
                  onEachFeature={(feature, layer) => {
                    layer.bindPopup(`
                      <div style="padding: 0.5rem; font-family: Arial, sans-serif;">
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #2f4f2f;">${property.propertyType}</h3>
                        <p style="font-size: 0.875rem; color: #4a704a;">Owner: ${property.owner}</p>
                        <p style="font-size: 0.875rem; color: #6b8e6b;">Floors: ${property.floors || 'N/A'}</p>
                        <p style="font-size: 0.875rem; color: #6b8e6b;">Year Built: ${property.yearBuilt || 'N/A'}</p>
                        <p style="font-size: 0.875rem; color: #6b8e6b;">Area: ${property.squareFootage} sq ft</p>
                        <button
                          onclick="window.handlePropertyEdit('${property.id}')"
                          style="margin-top: 0.5rem; padding: 0.375rem 0.75rem; background: #6b8e6b; color: white; border: none; border-radius: 4px; font-size: 0.875rem; cursor: pointer; transition: background 0.2s;"
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
                  <div style={{ padding: '0.5rem', fontFamily: 'Arial, sans-serif' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#2f4f2f' }}>{property.owner}</h3>
                    <p style={{ fontSize: '0.875rem', color: '#4a704a' }}>{property.address}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b8e6b' }}>{property.propertyType}</p>
                    <button
                      onClick={() => handleEdit(property)}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.375rem 0.75rem',
                        background: '#6b8e6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        ...(buttonHover[property.id] && { background: '#558855', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' })
                      }}
                      onMouseEnter={() => setButtonHover(prev => ({ ...prev, [property.id]: true }))}
                      onMouseLeave={() => setButtonHover(prev => ({ ...prev, [property.id]: false }))}
                    >
                      <Edit2 style={{ width: '1rem', height: '1rem', verticalAlign: 'middle', marginRight: '0.25rem' }} /> Edit Property
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '90vw',
            width: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#2f4f2f',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {editingProperty ? 'Edit Property Details' : 
                currentDrawing?.propertyType === 'plot' ? 'Add Property Details' : 'Add Building Details'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#2f4f2f',
                  marginBottom: '0.25rem'
                }}>Owner Name</label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({...formData, owner: e.target.value})}
                  onFocus={() => setInputFocus(prev => ({ ...prev, owner: true }))}
                  onBlur={() => setInputFocus(prev => ({ ...prev, owner: false }))}
                  style={{
                    ...inputBaseStyle,
                    ...(inputFocus.owner ? inputFocusStyle : {})
                  }}
                  required
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#2f4f2f',
                  marginBottom: '0.25rem'
                }}>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  onFocus={() => setInputFocus(prev => ({ ...prev, address: true }))}
                  onBlur={() => setInputFocus(prev => ({ ...prev, address: false }))}
                  style={{
                    ...inputBaseStyle,
                    ...(inputFocus.address ? inputFocusStyle : {})
                  }}
                  required
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#2f4f2f',
                  marginBottom: '0.25rem'
                }}>Property Type</label>
                <input
                  type="text"
                  value={formData.propertyType}
                  onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                  onFocus={() => setInputFocus(prev => ({ ...prev, propertyType: true }))}
                  onBlur={() => setInputFocus(prev => ({ ...prev, propertyType: false }))}
                  style={{
                    ...inputBaseStyle,
                    ...(inputFocus.propertyType ? inputFocusStyle : {})
                  }}
                  required
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#2f4f2f',
                  marginBottom: '0.25rem'
                }}>Number of Floors</label>
                <input
                  type="number"
                  value={formData.floors}
                  onChange={(e) => setFormData({...formData, floors: e.target.value})}
                  onFocus={() => setInputFocus(prev => ({ ...prev, floors: true }))}
                  onBlur={() => setInputFocus(prev => ({ ...prev, floors: false }))}
                  style={{
                    ...inputBaseStyle,
                    ...(inputFocus.floors ? inputFocusStyle : {})
                  }}
                  min="0"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#2f4f2f',
                  marginBottom: '0.25rem'
                }}>Year Built</label>
                <input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({...formData, yearBuilt: e.target.value})}
                  onFocus={() => setInputFocus(prev => ({ ...prev, yearBuilt: true }))}
                  onBlur={() => setInputFocus(prev => ({ ...prev, yearBuilt: false }))}
                  style={{
                    ...inputBaseStyle,
                    ...(inputFocus.yearBuilt ? inputFocusStyle : {})
                  }}
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#2f4f2f',
                  marginBottom: '0.25rem'
                }}>Square Footage</label>
                <input
                  type="number"
                  value={formData.squareFootage}
                  onChange={(e) => setFormData({...formData, squareFootage: e.target.value})}
                  onFocus={() => setInputFocus(prev => ({ ...prev, squareFootage: true }))}
                  onBlur={() => setInputFocus(prev => ({ ...prev, squareFootage: false }))}
                  style={{
                    ...inputBaseStyle,
                    ...(inputFocus.squareFootage ? inputFocusStyle : {})
                  }}
                  required
                  min="1"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#2f4f2f',
                  marginBottom: '0.25rem'
                }}>Secret Key</label>
                <input
                  type="password"
                  value={formData.secretKey}
                  onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                  onFocus={() => setInputFocus(prev => ({ ...prev, secretKey: true }))}
                  onBlur={() => setInputFocus(prev => ({ ...prev, secretKey: false }))}
                  style={{
                    ...inputBaseStyle,
                    ...(inputFocus.secretKey ? inputFocusStyle : {})
                  }}
                  required
                  placeholder="Enter 8–32 characters (letters, numbers, symbols)"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProperty(null);
                    if (!editingProperty && currentDrawing?.layer) {
                      currentDrawing.layer.remove();
                    }
                  }}
                  onMouseEnter={() => setButtonHover(prev => ({ ...prev, cancel: true }))}
                  onMouseLeave={() => setButtonHover(prev => ({ ...prev, cancel: false }))}
                  style={{
                    ...cancelButtonBaseStyle,
                    ...(buttonHover.cancel ? cancelButtonHoverStyle : {})
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onMouseEnter={() => setButtonHover(prev => ({ ...prev, submit: true }))}
                  onMouseLeave={() => setButtonHover(prev => ({ ...prev, submit: false }))}
                  style={{
                    ...buttonBaseStyle,
                    ...(buttonHover.submit ? buttonHoverStyle : {})
                  }}
                >
                  {editingProperty ? 'Save Changes' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showHashPopup && transactionHash && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#2f4f2f',
              marginBottom: '1rem'
            }}>
              NFT Minted Successfully!
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#4a704a',
              marginBottom: '1rem',
              wordBreak: 'break-all'
            }}>
              Transaction Hash: {transactionHash}
            </p>
            <a
              href={`https://explorer.solana.com/tx/${transactionHash}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...buttonBaseStyle,
                display: 'inline-block',
                textDecoration: 'none',
                marginBottom: '1rem'
              }}
              onMouseEnter={() => setButtonHover(prev => ({ ...prev, explorer: true }))}
              onMouseLeave={() => setButtonHover(prev => ({ ...prev, explorer: false }))}
            >
              View on Solana Explorer
            </a>
            <button
              onClick={() => setShowHashPopup(false)}
              onMouseEnter={() => setButtonHover(prev => ({ ...prev, close: true }))}
              onMouseLeave={() => setButtonHover(prev => ({ ...prev, close: false }))}
              style={{
                ...buttonBaseStyle,
                ...(buttonHover.close ? buttonHoverStyle : {})
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.handlePropertyEdit = (propertyId: string) => {
    const event = new CustomEvent('editProperty', { detail: { propertyId } });
    window.dispatchEvent(event);
  };
}

export default App;