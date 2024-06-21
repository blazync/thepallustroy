// Handle Add to Cart Functinality
function handleAddToCart({ userData, productId, productName,productImage,quantity }) {
     var userData = userData || {};
    if (userData && userData.isLoggedIn) {
        // User is logged in, proceed to add to cart
            addToCart(productId,quantity,'plus');
       } else {
            // User is not logged in, redirect to login page
                toastr.error('Please login to continue with cart.');
                setTimeout(function() {
            window.location.href = '/my-account'; // Replace with your login page URL
        }, 2000); 
             }
    }

function addToCart(productId,quantity,operation='plus') {
    const button = $('#button-cart');
    const parsedQuantity = parseInt(quantity, 10);
    
    // Update to Backend
        $.ajax({
        url: '/addtocart',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            operation:operation,
            productId: productId,
            quantity: parsedQuantity
        }),
        beforeSend: function () {
            button.button('loading');
        },
        success: function (response) {
            button.button('reset');
            toastr.success('Product added to cart successfully!');
            // Update local storage
         
        },
        error: function (error) {
            button.button('reset');
            toastr.error('Failed to add product to cart.');
        }
    });


}


function deleteProductFromCart(productId) {
    
    // Update to Backend
    $.ajax({
        url: '/deletefromcart',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            productId: productId
        }),

        success: function (response) {
            toastr.success('Product removed from cart successfully!');
            // Update local storage
            updateLocalStorage(-1);

            // Update DOM
            updateCartTotalDOM();
            document.getElementById(productId).remove()
            location.reload()
        },
        error: function (error) {
            toastr.error('Failed to remove product from cart.');
        }
    });
}










