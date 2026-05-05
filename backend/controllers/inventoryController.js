import Product from "../models/ProductModel.js";
import Inventory from "../models/InventoryModel.js";
import Notification from "../models/NotificationModel.js";
import User from "../models/UserModel.js";

export const createInventory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, currentStock, lowStockThreshold = 10 } = req.body;

    if (!productId || currentStock === undefined) {
      return res.status(400).json({
        success: false,
        message: "productId and currentStock are required",
      });
    }

    if (currentStock < 0 || lowStockThreshold < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock values cannot be negative",
      });
    }

    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const existing = await Inventory.findOne({ product: productId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Inventory already exists for this product",
      });
    }

    const inventory = await Inventory.create({
      product: productId,
      currentStock,
      lowStockThreshold,
      updatedBy: userId,
      movements: [
        {
          type: "restock",
          quantity: currentStock,
          note: "Initial stock setup",
          performedBy: userId,
        },
      ],
    });

    await inventory.populate("product", "name category price");

    res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      inventory,
    });
  } catch (error) {
    console.error("CreateInventory Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create inventory",
    });
  }
};

export const getInventory = async(req,res)=>{
      try {
            const userId = req.user._id;

            if(!userId){
                  return  res.status(400).json({
                  success:false,
                  message:"login to proceed"
            });
            }

            const {productId} = req.params;

            const inventory = await Inventory.findOne({product:productId}).populate(
                  "product","name category price discountPrice images").populate(
                  "movements.performedBy","firstName lastName role").populate(
                  "updatedBy","firstName lastName role");

            if(!inventory){
                  return  res.status(400).json({
                  success:false,
                  message:"inventory record not found for this product"
            });
            }      

            const sortedMovements =[...inventory.movements].sort(
                  (a,b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

             res.status(200).json({
                  success:true,
                  message:"inventory fetched succesfully",
                  inventory:{
                        ...inventory.toObject(),
                        movements:sortedMovements
                  }
            });
      } catch (error) {
            console.error("getInventory Error :",error);
             res.status(500).json({
                  success:false,
                  message:"failed to get inventory"
            });
      }
};

export const getAllInventory = async(req,res)=>{
      try {
            const userId = req.user._id;

            if(!userId){
                  return  res.status(400).json({
                  success:false,
                  message:"login to proceed"
            });
            }

            const {
                  page =1,
                  limit = 20,
                  sortBy ="createdBy",
                  order ="desc"
            }= req.query;

            const skip = (Number(page) - 1 ) * Number(limit);

            const sortOder = order === "asc" ? 1 :-1;

            const [inventory ,total] = await Promise.all([
                  Inventory.find()
                      .populate("product","name category price images isActive")
                      .populate("updatedBy","firstName lastName role")
                      .sort({[sortBy]:sortOder})
                      .skip(skip)
                      .limit(Number(limit))
                      .select("-movements"),
                  Inventory.countDocuments(),
            ]);
            
            res.status(200).json({
                  success:true,
                  total,
                  page:Number(page),
                  pages:Math.ceil(total /Number(limit)),
                  inventory
            });
      } catch (error) {
            console.error("getAllInventory Error : ", error)
            return  res.status(500).json({
                  success:false,
                  message:"failed fecth all inventory"
            });
      }
}

export const updateStock = async(req,res)=>{
      try {
            const performedBy = req.user._id;
            
            if(!performedBy){
                  return  res.status(400).json({
                  success:false,
                  message:"login to proceed"
             });
            }

            const {productId ,type,quantity ,note} = req.body;

            if(!productId || !type || quantity === undefined){
                  return  res.status(400).json({
                  success:false,
                  message:"all fields are required"
              });
            }

            if(quantity === 0){
                  return  res.status(400).json({
                  success:false,
                  message:"quantity cannot be zero"
              });
            }

            const inventory = await Inventory.findOne({product:productId});

            if(!inventory){
                  return  res.status(404).json({
                  success:false,
                  message:"inventory record not found for this product"
             });
            }

            const stockRemovingTypes = ["sale","damaged"];
            if(stockRemovingTypes.includes(type)&& inventory.currentStock < quantity){
                  return  res.status(400).json({
                  success:false,
                  message:`insufficient stock. Current stock is ${inventory.currentStock}`
            });
            }

            const stockChanges = {
                  restock: +quantity,
                  return: +quantity,
                  sale:-quantity,
                  damaged:-quantity,
                  adjustment:quantity
            }

            const newStock  = inventory.currentStock + stockChanges[type];
            
            if(newStock < 0){
                  return  res.status(400).json({
                  success:false,
                  message:`This adjustment results in negative stock (${newStock}). Current stock is ${inventory.currentStock}`
            });
            }

            inventory.movements.push({
                  type,
                  quantity:stockChanges[type],
                  note:note || "",
                  performedBy
            });

            inventory.currentStock = newStock;
            inventory.updatedBy = performedBy;

            await inventory.save();

            if(inventory.isLowStock || inventory.isoutOfStock){
                  const product = await Product.findById(productId).select("name");
                  
                  const notificationData = {
                      type: inventory.isoutOfStock ? "out_of_stock" : "low_stock",
                       title: inventory.isoutOfStock
                       ? `${product.name} is out of stock`
                       : `${product.name} is running low`,
                       message: inventory.isoutOfStock
                       ? `${product.name} has 0 units remaining. Please restock immediately.`
                       : `${product.name} has only ${inventory.currentStock} unit(s) left (threshold: ${inventory.lowStockThreshold}).`,
                       reference: {
                           model: "Product",
                           documentId: productId,
                         },
                   };
                   
                   const staffUsers = await User.find({
                        role:{$in:["admin","worker"]},
                        isDeleted:false,
                        isActive:true,
                   }).select("_id");

                   const notifications = staffUsers.map((staff)=>({
                        user:staff._id,
                        ...notificationData
                   }));

                   await Notification.insertMany(notifications);
            }

            await inventory.populate("product","name category price stock");

            res.status(200).json({
                  success:true,
                  message:"Stock updated succesfully",
                  inventory
            });
      } catch (error) {
            console.error("updateStock Error :",error);
            return  res.status(500).json({
                  success:false,
                  message:"failed update inventory"
            });
      }
}

export const getLowStock = async (req, res) => {
  try {

        const userId = req.user._id;

            if(!userId){
                  return  res.status(400).json({
                  success:false,
                  message:"login to proceed"
            });
            }

            const lowStock = await Inventory.find({ isLowStock: true })
                  .populate("product", "name category price images")
                  .populate("updatedBy", "firstName lastName")
                  .select("-movements")
                  .sort({ currentStock: 1 }); 
            
            res.status(200).json({
                  success: true,
                  total: lowStock.length,
                  inventory: lowStock,
            });

      } catch (error) {
      console.error("getLowStock error:", error);
      res.status(500).json({
            success: false,
            message: "Failed to fetch low stock products",
      });
  }
};

export const getOutOfStock = async (req, res) => {
  try {
            const userId = req.user._id;

            if(!userId){
                  return  res.status(400).json({
                  success:false,
                  message:"login to proceed"
            });
            }

            const outOfStock = await Inventory.find({ isoutOfStock: true })
                  .populate("product", "name category price images")
                  .populate("updatedBy", "firstName lastName")
                  .select("-movements")
                  .sort({ updatedAt: -1 }); 
            
            res.status(200).json({
                  success: true,
                  total: outOfStock.length,
                  inventory: outOfStock,
            });
      } catch (error) {
            console.error("getOutOfStock error:", error);
            res.status(500).json({
                  success: false,
                  message: "Failed to fetch out of stock products",
            });
      }
};