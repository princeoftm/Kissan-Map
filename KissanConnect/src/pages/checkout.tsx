import { useCart } from './CartContext';
import '../App.css'; 
import { mintNFt } from '../App'; // Assuming this function is exported from App.tsx
import deleteProduct from './deleteproduct'; // Assuming the delete function is imported

const Checkout = () => {
  const { state, dispatch } = useCart(); 

  const calculateTotal = () => {
    return state.cart.reduce((total, product) => total + product.price, 0); 
  };

  const handleProceed = () => {
    // Mint NFT (Make sure mintNFt is properly defined)
    mintNFt();

    // Delete all products in the cart after proceeding (or adjust this logic if needed)
    state.cart.forEach((product) => {
      deleteProduct(product.id);
    });
  };

  return (
    <div className="checkout-container">
      <h1 className="checkout-header">Checkout</h1>
      {state.cart.length === 0 ? (
        <p>Your cart is empty. Add items to the cart to proceed with checkout.</p>
      ) : (
        <div>
          {state.cart.map((product) => (
            <div key={product.id} className="checkout-item">
              <img src={product.imageUrl} alt={product.productName} />
              <div>
                <h2>{product.productName}</h2>
                <p>{product.description}</p>
                <p>Price: ${product.price}</p>
              </div>
            </div>
          ))}
          <div className="checkout-total">Total: ${calculateTotal()}</div>
          <button
            className="proceed-button"
            onClick={handleProceed} // Handle the click to mint NFT and delete products
          >
            Proceed to Payment and mint the NFT's
          </button>
        </div>
      )}
    </div>
  );
};

export default Checkout;
