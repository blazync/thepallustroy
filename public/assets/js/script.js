// Example code in EJS to load cart items from backend if local storage is empty
document.addEventListener('DOMContentLoaded', function() {
     let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    // Update UI with totalItems (length of cartItems)
    let totalItems = cartItems.length;
    updateCartTotal(totalItems)
});

function updateCartTotal(totalItems){
    document.getElementById('cart-total').textContent = totalItems.toString();
}
function getCartData({ userData, cartData }) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    // Check if the cart item already exists based on productId
    const existingItemIndex = cartItems.findIndex(item => item.productId === cartData.product._id);
    if (existingItemIndex !== -1) {
        // If item exists, update quantity
        cartItems[existingItemIndex].quantity += cartData.quantity;
    } else {
        // If item doesn't exist, add it to cartItems

        cartItems.push({
            productId: cartData.product._id,
            productName: cartData.product.name,
            productImage: cartData.product.images, // Assuming you want to store the first image
            quantity: cartData.quantity
            // Add other properties as needed
        });
    }
    // Update cartItems in local storage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    // Optionally, update total cart items displayed somewhere in UI
    updateCartTotal(cartItems.length); // Example: Pass total number of items

}

// Handle Add to Cart Functinality

function handleAddToCart({ userData, productId, productName,productImage,quantity }) {
     var userData = userData || {};
    if (userData && userData.isLoggedIn) {
        // User is logged in, proceed to add to cart
            addToCart({ userData, productId, productName,productImage,quantity });
       } else {
            // User is not logged in, redirect to login page
                toastr.error('Please login to continue with cart.');
                setTimeout(function() {
            window.location.href = '/my-account'; // Replace with your login page URL
        }, 2000); 
             }
    }

function updateLocalStorage(cartItems) {
    console.log(cartItems)
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }

function addToCart({ userData, productId, productName, productImage, quantity }) {
    const button = $('#button-cart');
    const parsedQuantity = parseInt(quantity, 10);
    
    // Update to Backend
        $.ajax({
        url: '/addtocart',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            userData: userData,
            productId: productId,
            productName: productName,
            productImage: productImage,
            quantity: parsedQuantity
        }),
        beforeSend: function () {
            button.button('loading');
        },
        success: function (response) {
            button.button('reset');
            toastr.success('Product added to cart successfully!');
            updateLocalStorage(cartItems);
        },
        error: function (error) {
            button.button('reset');
            toastr.error('Failed to add product to cart.');
        }
    });

    // Update to Local Storage
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existingCartItemIndex = cartItems.findIndex(item => item.productId === productId);

    if (existingCartItemIndex !== -1) {
        
        cartItems[existingCartItemIndex].quantity += parsedQuantity;
        
    } else {
        cartItems.push({
            productId: productId,
            productName: productName,
            productImage: productImage,
            quantity: parsedQuantity
        });  
    }
    updateLocalStorage(cartItems)
    updateCartTotal(cartItems.length)


}


function updateQuantityWithValue(quantity, productId) {
    const button = $('#button-cart');
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const parsedQuantity = parseInt(quantity, 10);  
        // Update to Backend
        $.ajax({
        url: '/update-cart',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            productId: productId,
            quantity: parsedQuantity
        }),
        beforeSend: function () {
            button.button('loading');
        },
        success: function (response) {
            button.button('reset');
            toastr.success('Product added to cart successfully!');
            updateLocalStorage(cartItems);
        },
        error: function (error) {
            button.button('reset');
            toastr.error('Failed to add product to cart.');
        }
    });
    // Update to Local Storage
    const index = cartItems.findIndex(item => item.productId === productId);

    if (index !== -1) {
        // Product found, update its quantity
        console.log( cartItems[index].quantity,parsedQuantity)
        cartItems[index].quantity = parsedQuantity;
        console.log( cartItems[index].quantity)

        // Update local storage
        localStorage.setItem('cartItems', JSON.stringify(cartItems));

        console.log(`Quantity updated for product with productId ${productId} to ${parsedQuantity}`);
        location.reload();
    } else {
        console.error(`Product with productId ${productId} not found in cartItems.`);
    }
}

function deleteProductFromCart(productId) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    // Filter out the product with the specified productId
    cartItems = cartItems.filter(item => item.productId !== productId);

    // Update local storage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    document.getElementById(productId).remove();

    console.log(`Product with productId ${productId} deleted from cart.`);
}

function clearCart() {
    // Clear the cartItems from local storage
    localStorage.removeItem('cartItems');
    console.log('Cart cleared.');
}







