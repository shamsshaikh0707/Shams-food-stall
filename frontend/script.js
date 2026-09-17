let products = [];
let cart = [];

const menu = document.getElementById("menu");
const cartContainer = document.getElementById("cart");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");


async function loadProducts() {

    try {

        const response = await fetch(
            "http://localhost:3000/api/products"
        );

        products = await response.json();

        displayProducts();

    } catch (error) {

        console.error("Error loading products:", error);

        menu.innerHTML = `
            <p>Unable to load menu.</p>
        `;
    }
}


function displayProducts() {

    menu.innerHTML = "";

    products.forEach(function(product) {

        const card = document.createElement("div");

        card.className = "food-card";

        if (product.available) {

            card.innerHTML = `
                <h3>${product.name}</h3>
                <p>₹${product.price}</p>

                <button onclick="addToCart(${product.id})">
                    Add to Cart
                </button>
            `;

        } else {

            card.innerHTML = `
                <h3>${product.name}</h3>
                <p>₹${product.price}</p>

                <button disabled>
                    Out of Stock
                </button>
            `;
        }

        menu.appendChild(card);
    });
}


function addToCart(productId) {

    const product = products.find(function(item) {
        return item.id === productId;
    });

    const existingItem = cart.find(function(item) {
        return item.id === productId;
    });

    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    displayCart();
}


function displayCart() {

    cartContainer.innerHTML = "";

    if (cart.length === 0) {

        cartContainer.innerHTML = "<p>Your cart is empty.</p>";

    } else {

        cart.forEach(function(item) {

            const cartItem = document.createElement("div");

            cartItem.className = "cart-item";

            cartItem.innerHTML = `
                <h3>${item.name}</h3>

                <p>₹${item.price} × ${item.quantity}</p>

                <button onclick="decreaseQuantity(${item.id})">
                    -
                </button>

                <span>${item.quantity}</span>

                <button onclick="increaseQuantity(${item.id})">
                    +
                </button>

                <button onclick="removeFromCart(${item.id})">
                    Remove
                </button>
            `;

            cartContainer.appendChild(cartItem);
        });
    }

    updateCartSummary();
}


function increaseQuantity(productId) {

    const item = cart.find(function(item) {
        return item.id === productId;
    });

    item.quantity++;

    displayCart();
}


function decreaseQuantity(productId) {

    const item = cart.find(function(item) {
        return item.id === productId;
    });

    if (item.quantity > 1) {

        item.quantity--;

    } else {

        removeFromCart(productId);
        return;
    }

    displayCart();
}


function removeFromCart(productId) {

    cart = cart.filter(function(item) {
        return item.id !== productId;
    });

    displayCart();
}


function updateCartSummary() {

    let total = 0;
    let count = 0;

    cart.forEach(function(item) {

        total += item.price * item.quantity;
        count += item.quantity;

    });

    cartTotal.textContent = total;
    cartCount.textContent = count;
}


loadProducts();
displayCart();