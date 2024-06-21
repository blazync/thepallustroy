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
            // Update local storage
            updateLocalStorage(parsedQuantity);

            // Update DOM
            updateCartTotalDOM();
        },
        error: function (error) {
            button.button('reset');
            toastr.error('Failed to add product to cart.');
        }
    });


}


function deleteProductFromCart(productId) {
 const button = $('#button-remove-cart');
    
    // Update to Backend
    $.ajax({
        url: '/deletefromcart',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            productId: productId
        }),
        beforeSend: function () {
            button.button('loading');
        },
        success: function (response) {
            button.button('reset');
            toastr.success('Product removed from cart successfully!');
            // Update local storage
            updateLocalStorage(-1);

            // Update DOM
            updateCartTotalDOM();
        },
        error: function (error) {
            button.button('reset');
            toastr.error('Failed to remove product from cart.');
        }
    });
}


function updateLocalStorage(quantity) {
    // Get the current cart total from local storage
    let cartTotal = localStorage.getItem('cartTotal');
    if (cartTotal) {
        cartTotal = parseInt(cartTotal, 10);
    } else {
        cartTotal = 0;
    }
    // Add the new quantity to the current cart total
    cartTotal += quantity;

    // Store the updated cart total back to local storage
    localStorage.setItem('cartTotal', cartTotal);
}

function updateCartTotalDOM() {
    // Get the current cart total from local storage
    let cartTotal = localStorage.getItem('cartTotal');
    if (cartTotal) {
        cartTotal = parseInt(cartTotal, 10);
    } else {
        cartTotal = 0;
    }

    // Update the cart-total span in the DOM
    document.getElementById('cart-total').textContent =  cartTotal;
}




function clearCart() {
    // Clear the cartItems from local storage
    localStorage.removeItem('cartTotal');
    console.log('Cart cleared.');
}







