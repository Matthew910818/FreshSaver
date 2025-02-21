const mongoose = require('mongoose');
const Product = require('./models/Product');


mongoose.connect('mongodb://localhost:27017/healthy_market', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const products = [
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

Product.insertMany(products).then(() => {
  console.log("✅ Products added!");
  mongoose.connection.close();
});

async function seedDatabase() {
  try {
      await Product.deleteMany({}); // Clears all products before inserting new ones
      console.log("🗑️ Old products cleared!");

      await Product.insertMany(products);
      console.log("✅ New products added!");
  } catch (err) {
      console.error("❌ Error:", err);
  } finally {
      mongoose.connection.close();
  }
}

seedDatabase();