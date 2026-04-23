import Product from "../models/ProductModel.js";
import Inventory from "../models/InventoryModel.js";
import Review from "../models/ReviewModel.js";


export const createProduct = async (req, res) => {
  try {
    const adminId = req.user._id;
    const {
      name,
      description,
      category,
      price,
      discountPrice,
      stock,
      images,
      lowStockThreshold,
    } = req.body;

    
    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, category, price and stock are required",
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    if (discountPrice !== undefined && discountPrice >= price) {
      return res.status(400).json({
        success: false,
        message: "Discount price must be less than the regular price",
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    
    const duplicate = await Product.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") }, // case-insensitive
      category: { $regex: new RegExp(`^${category}$`, "i") },
      isDeleted: false,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "A product with this name already exists in this category",
      });
    }

    const product = await Product.create({
      name,
      description,
      category,
      price,
      discountPrice: discountPrice || null,
      stock,
      images: images || [],
      createdBy: adminId,
    });

    await Inventory.create({
      product: product._id,
      currentStock: stock,
      lowStockThreshold: lowStockThreshold || 10,
      updatedBy: adminId,
      movements: [
        {
          type: "restock",
          quantity: stock,
          note: "Initial stock on product creation",
          performedBy: adminId,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("createProduct error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
      isDeleted: false,
    }).populate("createdBy", "firstName lastName");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      });
    }

   
    const reviews = await Review.find({
      product: productId,
      isDeleted: false,
    })
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      product,
      reviews,
    });
  } catch (error) {
    console.error("getProduct error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      order = "desc",
      category,
      minPrice,
      maxPrice,
      minRating,
      inStock,       // ?inStock=true → only in-stock products
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    // build filter dynamically
    const filter = {
      isActive: true,
      isDeleted: false,
    };

    if (category) {
      filter.category = { $regex: new RegExp(category, "i") };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (minRating) {
      filter["ratings.average"] = { $gte: Number(minRating) };
    }

    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("-createdBy") 
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    console.error("getAllProducts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { productId } = req.params;
    const {
      name,
      description,
      category,
      price,
      discountPrice,
      images,
      isActive,
    } = req.body;

    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updatedPrice = price ?? product.price;
    const updatedDiscountPrice =
      discountPrice !== undefined ? discountPrice : product.discountPrice;

    if (
      updatedDiscountPrice !== null &&
      updatedDiscountPrice >= updatedPrice
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount price must be less than the regular price",
      });
    }

    if (name        !== undefined) product.name        = name;
    if (description !== undefined) product.description = description;
    if (category    !== undefined) product.category    = category;
    if (price       !== undefined) product.price       = price;
    if (images      !== undefined) product.images      = images;
    if (isActive    !== undefined) product.isActive    = isActive;

    if (discountPrice !== undefined) product.discountPrice = discountPrice;

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("updateProduct error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};


export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isDeleted = true;
    product.isActive  = false;
    await product.save();

    await Inventory.findOneAndUpdate(
      { product: productId },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("deleteProduct error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};


export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20, sortBy = "createdAt", order = "desc" } =
      req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const filter = {
      category: { $regex: new RegExp(`^${category}$`, "i") },
      isActive: true,
      isDeleted: false,
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("-createdBy")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    if (total === 0) {
      return res.status(404).json({
        success: false,
        message: `No products found in category: ${category}`,
      });
    }

    res.status(200).json({
      success: true,
      category,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    console.error("getProductsByCategory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products by category",
    });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const searchRegex = new RegExp(q.trim(), "i");

    const filter = {
      $or: [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ],
      isActive: true,
      isDeleted: false,
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("-createdBy")
        .sort({ "ratings.average": -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      query: q,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    console.error("searchProducts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search products",
    });
  }
};