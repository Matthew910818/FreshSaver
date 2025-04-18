// Global variables for product list, cart, and fridge inventory
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let fridgeItems = JSON.parse(localStorage.getItem("fridge")) || [];
let currentAmount = 1; 


function updateCartCount() {
    let cartCount = document.getElementById("cartCount");
    if (cartCount) {
        cartCount.textContent = cart.length;
    } else {
        console.warn("⚠ Warning: 'cartCount' element not found! Skipping update.");
    }
}

function clearCart() {
    localStorage.removeItem("cart");
    cart = []; 
    updateCartCount();
    
    // Update cart items in checkout page if we're on that page
    if (document.getElementById("cartItems")) {
        document.getElementById("cartItems").innerHTML = ""; 
        document.getElementById("totalPrice").textContent = "0.00";
    }
    
    // Refresh the checkout items display
    if (document.getElementById("combinedItems")) {
        loadCheckoutItems();
    }
}

function clearFridge() {
    localStorage.removeItem("fridge");
    fridgeItems = []; 
    displayFridgeItems();
}


async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        
        // Display error message in product list
        const container = document.getElementById("productList");
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>⚠️ Could not load products</h3>
                    <p>The server appears to be offline. Please make sure the backend server is running.</p>
                    <p>To start the server, open a terminal and run:</p>
                    <pre>cd backend && node server.js</pre>
                </div>
            `;
        }
        
        // Fallback to sample products if server is not available
        products = [
            {
                name: "Carrot",
                category: "Vegetables",
                imageUrl: "/images/carrot.png",
                price: 3.99
            },
            {
                name: "Chicken Breast",
                category: "Meat",
                imageUrl: "/images/chicken_breast.png",
                price: 5.99
            }
        ];
    }
}

function displayProducts(productList) {
    const container = document.getElementById("productList");
    if (!container) return;

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

function filterProducts(category) {
    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");

    const filtered = category === "All" ? products : products.filter(p => p.category === category);
    displayProducts(filtered);
}


function addToCart(name, price) {
    cart.push({ name, price });
    localStorage.setItem("cart", JSON.stringify(cart)); // ✅ Save cart in localStorage
    updateCartCount(); // ✅ Update count after adding item
}


function updateCartCount() {
    document.getElementById("cartCount").textContent = cart.length;
}


function loadCart() {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartList = document.getElementById("cartItems");
    let totalElement = document.getElementById("totalPrice");

    if (cartList && totalElement) {
        cartList.innerHTML = cart.map(item => `<li>${item.name} - $${item.price.toFixed(2)}</li>`).join("");
        totalElement.textContent = cart.reduce((total, item) => total + item.price, 0).toFixed(2);
    }
}


function changeAmount(value) {
    currentAmount = Math.max(1, currentAmount + value); 
    document.getElementById("currentAmount").textContent = currentAmount; 
}


function addFridgeItem() {
    let itemName = document.getElementById("fridgeItem").value.trim();
    if (!itemName) return;

    fridgeItems.push({ name: itemName, amount: currentAmount });
    localStorage.setItem("fridge", JSON.stringify(fridgeItems));

    document.getElementById("fridgeItem").value = "";
    currentAmount = 1;
    document.getElementById("currentAmount").textContent = currentAmount;
    displayFridgeItems();
}


function displayFridgeItems() {
    let fridgeList = document.getElementById("fridgeList");
    if (!fridgeList) return;

    fridgeList.innerHTML = "";
    fridgeItems.forEach((item, index) => {
        let li = document.createElement("li");
        li.innerHTML = `${item.name} - ${item.amount} 
                        <button class="delete-btn" onclick="removeFridgeItem(${index})">❌</button>`;
        fridgeList.appendChild(li);
    });
}


function removeFridgeItem(index) {
    fridgeItems = JSON.parse(localStorage.getItem("fridge")) || [];
    fridgeItems.splice(index, 1);
    localStorage.setItem("fridge", JSON.stringify(fridgeItems));
    displayFridgeItems();
}


if (document.getElementById("fridgeList")) {
    displayFridgeItems();
}


if (document.getElementById("cartItems")) {
    loadCart();
}


if (document.getElementById("productList")) {
    fetchProducts();
}

function getUserInfo() {
    let userInfo = JSON.parse(localStorage.getItem("userInfo")) || {
        age: "unknown",
        gender: "unknown",
        height: "unknown",
        weight: "unknown"
    };
    return userInfo;
}


function loadCheckoutItems() {
    let combinedItemsList = document.getElementById("combinedItems");
    let totalElement = document.getElementById("totalPrice");
    if (!combinedItemsList || !totalElement) return;

    // Use global variables first, then fallback to localStorage
    // This ensures we have the most up-to-date state after operations like clearCart()
    let currentCart = cart;
    let currentFridgeItems = fridgeItems;
    
    combinedItemsList.innerHTML = "";
    let totalPrice = 0;
    
    // Display fridge items
    currentFridgeItems.forEach(item => {
        let li = document.createElement("li");
        li.textContent = `${item.name} - ${item.amount || 1} (From Fridge)`;
        combinedItemsList.appendChild(li);
    });
    
    // Display and calculate price for cart items only
    currentCart.forEach(item => {
        let li = document.createElement("li");
        li.textContent = `${item.name} - ${item.amount || 1}`;
        combinedItemsList.appendChild(li);
        totalPrice += item.price || 0;
    });

    totalElement.textContent = totalPrice.toFixed(2);
}

async function getRecipes() {
    // Show loading indicator
    const recipeResults = document.getElementById("recipeResults");
    recipeResults.innerHTML = "Loading recipe suggestions...";
    
    let fridgeItems = JSON.parse(localStorage.getItem("fridge")) || [];
    let cartItems = JSON.parse(localStorage.getItem("cart")) || [];
    let allIngredients = [...fridgeItems.map(item => item.name), ...cartItems.map(item => item.name)].join(", ");

    // If no ingredients, display a message
    if (allIngredients.trim() === "") {
        recipeResults.innerHTML = "Please add some ingredients to your fridge or cart first.";
        return;
    }

    let userInfo = getUserInfo();

    let prompt = `I have these ingredients: ${allIngredients}. 
    Suggest 3 dishes I can make.
    Also, the user provided the following personal details:
    - Age: ${userInfo.age}
    - Gender: ${userInfo.gender}
    - Height: ${userInfo.height} cm
    - Weight: ${userInfo.weight} kg
    Based on this information, suggest the appropriate portion sizes for each recipe.
    Provide the response in JSON format with:
    [
        { "dish_name": "Dish Name", "required_ingredients": [{"name": "Ingredient", "amount_g": 100}], "portion_size": "200g" }
    ]`;

    try {
        let response = await fetch("http://localhost:3000/api/getRecipes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ingredients: allIngredients, user: userInfo })
        });

        let data = await response.json();
        console.log("🔍 API Response:", JSON.stringify(data, null, 2));

        if (data.recipes && Array.isArray(data.recipes)) {
            displayRecipes(data.recipes);
        } else if (data.error) {
            recipeResults.innerHTML = `<div class="error-message">Error: ${data.error}</div>`;
        } else {
            recipeResults.innerHTML = "⚠ No recipes found or invalid response format.";
        }
    } catch (error) {
        console.error("❌ Error getting recipes:", error);
        recipeResults.innerHTML = `<div class="error-message">Error fetching recipes: ${error.message}</div>`;
    }
}

function displayRecipes(recipes) {
    if (!Array.isArray(recipes)) {
        console.error("❌ Expected an array but got:", recipes);
        document.getElementById("recipeResults").textContent = "⚠ No valid recipes found!";
        return;
    }

    let recipeResults = document.getElementById("recipeResults");
    recipeResults.innerHTML = ""; // Clear previous results

    recipes.forEach(recipe => {
        let div = document.createElement("div");
        div.classList.add("recipe");

        let ingredientsList = "No ingredients provided";
        if (Array.isArray(recipe.required_ingredients) && recipe.required_ingredients.length > 0) {
            ingredientsList = recipe.required_ingredients
                .map(ing => `${ing.name}: ${ing.amount_g}g`)
                .join("<br>");
        }

        let portionSize = recipe.portion_size || "Not provided";

        div.innerHTML = `
            <h3><strong>${recipe.dish_name}</strong></h3>
            <p><strong>Ingredients:</strong><br> ${ingredientsList}</p>
            <p><strong>Portion Size:</strong> ${portionSize}</p>
        `;
        recipeResults.appendChild(div);
    });
}

function openUserInfo() {
    let userInfo = JSON.parse(localStorage.getItem("userInfo")) || {};
    document.getElementById("modalUserAge").value = userInfo.age || "";
    document.getElementById("modalUserGender").value = userInfo.gender || "Male";
    document.getElementById("modalUserHeight").value = userInfo.height || "";
    document.getElementById("modalUserWeight").value = userInfo.weight || "";
    document.getElementById("userInfoModal").style.display = "block";
}

function closeUserInfo() {
    document.getElementById("userInfoModal").style.display = "none";
}

function saveUserInfo() {
    let userInfo = {
        age: document.getElementById("modalUserAge").value,
        gender: document.getElementById("modalUserGender").value,
        height: document.getElementById("modalUserHeight").value,
        weight: document.getElementById("modalUserWeight").value
    };

    localStorage.setItem("userInfo", JSON.stringify(userInfo));
    closeUserInfo();
    updateUserInfoDisplay(); // Update the display after saving
}

function updateUserInfoInputs() {
    let userInfo = JSON.parse(localStorage.getItem("userInfo")) || {};
    document.getElementById("modalUserAge").value = userInfo.age || "";
    document.getElementById("modalUserGender").value = userInfo.gender || "Male";
    document.getElementById("modalUserHeight").value = userInfo.height || "";
    document.getElementById("modalUserWeight").value = userInfo.weight || "";
}

// New function to update the user info display on the checkout page
function updateUserInfoDisplay() {
    let userInfo = getUserInfo();
    
    // Update the display spans if they exist
    if (document.getElementById("displayUserAge")) {
        document.getElementById("displayUserAge").textContent = userInfo.age || "N/A";
    }
    if (document.getElementById("displayUserGender")) {
        document.getElementById("displayUserGender").textContent = userInfo.gender || "N/A";
    }
    if (document.getElementById("displayUserHeight")) {
        document.getElementById("displayUserHeight").textContent = userInfo.height || "N/A";
    }
    if (document.getElementById("displayUserWeight")) {
        document.getElementById("displayUserWeight").textContent = userInfo.weight || "N/A";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    loadCart();
    loadCheckoutItems();
    displayFridgeItems();
    updateUserInfoInputs();
    updateUserInfoDisplay(); // Add this to update the display on page load
});


if (document.getElementById("combinedItems")) {
    loadCheckoutItems();
}