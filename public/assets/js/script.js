// Handle Add to Cart Functinality
function handleAddToCart({ userData, productId, quantity }) {
     var userData = userData || {};
    if (userData && userData.isLoggedIn) {
        // User is logged in, proceed to add to cart
            addToCart(productId,quantity,'plus');
       } else {
            // User is not logged in, redirect to login page
                addToLocalStorageCart(productId, quantity);
                toastr.success('Product Added to Cart Successfully.');
                
             }
    }

        // handle use login
    function handleUserLogin() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length > 0) {
            addLocalStorageCartToBackend(cart);
            localStorage.removeItem('cart'); // Clear the local storage cart after syncing
        }
}

function addLocalStorageCartToBackend(cart) {
  

    // Prepare the data to be sent to the backend
    const cartData = cart.map(item => ({
        operation: 'plus',
        productId: item.productId,
        quantity: item.quantity
    }));

    // Send each cart item to the backend
    cartData.forEach(item => {
        $.ajax({
            url: '/addtocart',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(item),
       
            success: function (response) {
                button.button('reset');
                toastr.success('Product added to cart successfully!');
                // Update local storage if necessary
                location.reload();
            },
            error: function (error) {
                button.button('reset');
                toastr.error('Failed to add product to cart.');
            }
        });
    });
}


function addToLocalStorageCart(productId, quantity) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingProduct = cart.find(item => item.productId === productId);

    if (existingProduct) {
        existingProduct.quantity += parseInt(quantity, 10);
    } else {
        cart.push({ productId, quantity: parseInt(quantity, 10) });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
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
            document.getElementById(productId).remove()
            location.reload()
        },
        error: function (error) {
            toastr.error('Failed to remove product from cart.');
        }
    });
}


	// Handle Add to Wishlist Functionality
    function handleAddToWishlist({ userData, productId, productName, productImage }) {
        var userData = userData || {};
        if (userData && userData.isLoggedIn) {
            // User is logged in, proceed to add to wishlist
            addToWishlist(productId);
        } else {
            // User is not logged in, show error and redirect to login page
            toastr.error('Please login to add to wishlist.');
            setTimeout(function () {
                window.location.href = '/my-account'; // Replace with your login page URL
            }, 2000);
        }
    }

    function addToWishlist(productId) {
        const button = $('#button-add-to-wishlist');

        // Update to Backend
        $.ajax({
            url: '/addtowishlist',
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
                toastr.success('Product added to wishlist successfully!');
                // Optionally update UI to reflect wishlist change
                // Example: Update button text or icon if needed
            },
            error: function (error) {
                button.button('reset');
                toastr.error('Failed to add product to wishlist.');
            }
        });
    }


    // Contact Form Enquiry
    $(document).ready(function() {
									$('#contact-form').on('submit', function(event) {
										event.preventDefault(); // Prevent the default form submission
						
										$.ajax({
											url: '/savecontact',
											type: 'POST',
											data: $(this).serialize(),
											success: function(response) {
												toastr.success('Your message has been sent successfully');
												$('#contact-form')[0].reset(); // Reset the form
											},
											error: function(xhr, status, error) {
												toastr.error('There was an error submitting your enquiry. Please try again.');
											}
										});
									});
								});










