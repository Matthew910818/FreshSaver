// Global variables for product list, cart, and fridge inventory
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let fridgeItems = JSON.parse(localStorage.getItem("fridge")) || [];
let currentAmount = 1; // Default amount for fridge items

function clearCart() {
    localStorage.removeItem("cart"); // ✅ Only clear cart when user clicks
    cart = []; // Reset cart array
    updateCartCount(); // ✅ Update UI count
    document.getElementById("cartItems").innerHTML = ""; // Clear cart display
    document.getElementById("totalPrice").textContent = "0.00"; // Reset total price
}

function clearFridge() {
    localStorage.removeItem("fridge"); // ✅ Only clear fridge when user clicks
    fridgeItems = []; // Reset fridge array
    displayFridgeItems(); // ✅ Update UI
}


// Fetch product data from backend and display products
async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

function displayProducts(productList) {
    const container = document.getElementById("productList");
    container.innerHTML = "";

    productList.forEach(product => {
        const imageUrl = `http://localhost:3000${product.imageUrl}`;
        const productElement = document.createElement("div");
        productElement.classList.add("product");
        productElement.innerHTML = `
            <img src="${imageUrl}" 
                 alt="${product.name}" 
                 onerror="this.onerror=null; this.src='http://localhost:3000/images/default.png';">
            <h3>${product.name}</h3>
            <p>${product.category} - $${product.price.toFixed(2)}</p>
            <button onclick="addToCart('${product.name}', ${product.price})">Add to Cart</button>
        `;
        container.appendChild(productElement);
    });
}

// Filter products based on category
function filterProducts(category) {
    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");

    const filtered = category === "All" ? products : products.filter(p => p.category === category);
    displayProducts(filtered);
}

// Add product to shopping cart
function addToCart(name, price) {
    cart.push({ name, price });
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

// Update shopping cart count in UI
function updateCartCount() {
    document.getElementById("cartCount").textContent = cart.length;
}

// Load cart items from `localStorage` and display them
function loadCart() {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    document.getElementById("cartItems").innerHTML = cart.map(item => `<li>${item.name} - $${item.price.toFixed(2)}</li>`).join("");
    document.getElementById("totalPrice").textContent = cart.reduce((total, item) => total + item.price, 0).toFixed(2);
}

// Change the amount for fridge items using +1 and -1 buttons
function changeAmount(value) {
    currentAmount = Math.max(1, currentAmount + value); // Ensure amount doesn't go below 1
    document.getElementById("currentAmount").textContent = currentAmount; // Update displayed amount
}

// Add food item + amount to fridge inventory
function addFridgeItem() {
    let itemName = document.getElementById("fridgeItem").value.trim();

    if (itemName === "") return;

    let fridgeItems = JSON.parse(localStorage.getItem("fridge")) || [];
    fridgeItems.push({ name: itemName, amount: currentAmount });
    localStorage.setItem("fridge", JSON.stringify(fridgeItems));

    document.getElementById("fridgeItem").value = "";
    currentAmount = 1; // Reset amount after adding
    document.getElementById("currentAmount").textContent = currentAmount; // Reset displayed amount
    displayFridgeItems();
}

// Display fridge items in the list
function displayFridgeItems() {
    let fridgeList = document.getElementById("fridgeList");
    let fridgeItems = JSON.parse(localStorage.getItem("fridge")) || [];

    fridgeList.innerHTML = "";
    fridgeItems.forEach((item, index) => {
        let li = document.createElement("li");
        li.innerHTML = `${item.name} - ${item.amount} 
                        <button class="delete-btn" onclick="removeFridgeItem(${index})">❌</button>`;
        fridgeList.appendChild(li);
    });
}

// Remove an item from the fridge inventory
function removeFridgeItem(index) {
    let fridgeItems = JSON.parse(localStorage.getItem("fridge")) || [];
    fridgeItems.splice(index, 1);
    localStorage.setItem("fridge", JSON.stringify(fridgeItems));
    displayFridgeItems();
}

// Ensure fridge items display on page load
if (document.getElementById("fridgeList")) {
    displayFridgeItems();
}

// Ensure cart items load when checkout page is opened
if (document.getElementById("cartItems")) {
    loadCart();
}

// Fetch products when homepage loads
if (document.getElementById("productList")) {
    fetchProducts();
}

// Load combined items in checkout.html
function loadCheckoutItems() {
    let combinedItemsList = document.getElementById("combinedItems");
    let totalPrice = 0;

    combinedItemsList.innerHTML = "";

    let allItems = [...fridgeItems, ...cart]; // Combine fridge & cart items

    allItems.forEach(item => {
        let li = document.createElement("li");
        li.textContent = `${item.name} - ${item.amount || 1}`;
        combinedItemsList.appendChild(li);
        totalPrice += item.price || 0; // Add price if available
    });

    document.getElementById("totalPrice").textContent = totalPrice.toFixed(2);
}

async function getRecipes() {
    let ingredients = [...fridgeItems.map(item => item.name), ...cart.map(item => item.name)].join(", ");

    try {
        let response = await fetch("http://localhost:3000/api/getRecipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ingredients: ingredients })
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        let data = await response.json();

        if (data.recipes && Array.isArray(data.recipes)) {
            let recipeResults = document.getElementById("recipeResults");
            recipeResults.innerHTML = "";

            data.recipes.forEach(recipe => {
                let recipeElement = document.createElement("div");
                recipeElement.classList.add("recipe-item");
                recipeElement.innerHTML = `
                    <h3>${recipe.dish_name}</h3>
                    <p><strong>Ingredients:</strong> ${recipe.required_ingredients.join(", ")}</p>
                `;
                recipeResults.appendChild(recipeElement);
            });

        } else {
            document.getElementById("recipeResults").textContent = "No recipes found.";
        }
    } catch (error) {
        console.error("❌ Error fetching recipes:", error);
        document.getElementById("recipeResults").textContent = "❌ Error fetching recipes.";
    }
}

// Load checkout items when `checkout.html` is opened
if (document.getElementById("combinedItems")) {
    loadCheckoutItems();
}