import Product from "../models/ProductModel.js";
import Cart from "../models/CartModel.js";


export const addToCart = async(req,res)=>{
      try {
      const userId = req.user._id;
      const {productId, quantity = 1} = req.body;

      if(!productId){
            return   res.status(400).json(
            {
                  success:false,
                  message:"product id is required"
            }
      );
}
      if(quantity <1){
            return   res.status(500).json(
            {
                  success:false,
                  message:"quantity must bge at least 1"
            }
      );
}
      const product = await Product.findOne({
            _id:productId,
            isActive:true,
            isDeleted:false
      });


      if(!product){
            return   res.status(400).json(
            {
                  success:false,
                  message:"product not found"
            }
      );
      }

      if(product.stock < quantity){
            return   res.status(400).json(
            {
                  success:false,
                  message:`Only ${product.stock} unit(s) available in stock`
            }
      );
      }

      let cart = await Cart.findOne(
            {user:userId,
                  isCheckedOut:false
            }
      );

      if(!cart){
            cart = new Cart({user:userId, items:[]});
      }
      
      const existingItemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId.toString()
      );

      if(existingItemIndex !== -1){
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            
            if(newQuantity > product.stock){
                  return   res.status(400).json(
            {
                  success:false,
                  message:`cannot add more.Only ${product.stock} units available`
            }
      );
            }

            cart.item[existingItemIndex].quantity = newQuantity
      }else{
            //new product push it into item
            cart.items.push({
                  product:productId,
                  quantity,
                  priceAtAddedTime:product.discountPrice ?? product.price
            });
      }

      await cart.save();

      await cart.populate("items.product","name price discountPrice images stock");

      res.status(200).json(
            {
                  success:true,
                  message:"product added to cart",
                  cart
            }
      );

} catch (error) {
      console.error("addToCartError:",error)
      res.status(500).json(
            {
                  success:false,
                  message:"failed to add to cart"
            }
      );
}
};


export const getcart = async(req,res)=>{
      try {
            const userId = req.user._id;
           
            if(!userId){
                  return res.status(400).json({
                        success:false,
                        message:"login to proceed"
                  });
            }

            const user = await User.findById(userId);

            if(!user){
                  return res.status(400).json({
                        success:false,
                        message:"user not found"
                  });
            }

            const cart = await cart.findOne({
                  user:userId,
                  isCheckedOut:false
            }).populate("items.product","name price discountPrize images stock isActive isDeleted");
            
            if(!cart||cart.items ===0){
                  return res.status(200).json({
                        success:true,
                        message:"your cart is empty"
                  });
            }

            const validItems = cart.items.filter(
                  (item) => item.product && item.product.isctive && !item.product.isDeleted
            );

            if(validItems.length !== cart.item.length){
                  cart.item = validItems;
                  await cart.save();
            }

            res.status(200).json({
                  success:true,
                  message:"cart fetched succesfully",
                  cart
            });
      } catch (error) {
            console.error("getCart Error:",error);
            res.status(500).json({
                  success:false,
                  message:"cannot get cart"
            });
      }
}

export const updateCartItem = async(req,res)=>{
      try {
            const userId = req.user._id;
            const { productId ,quantity} = req.body;

            if(!userId){
                  return res.status(400).json({
                        success:false,
                        message:"login to proceed"
                  });
            }

            if(!productId ||quantity === undefined){
                  return res.status(400).json({
                        success:false,
                        message:"productId and quantity are required"
                  });
            }

            if(quantity < 1){
                  return res.status(400).json({
                        success:false,
                        message:"login to proceed"
                  });
            }

            const product = await Product.findOne({
                  _id:productId,
                  isActive:true,
                  isDeleted:false
            });

            if(!product){
                  return res.status(400).json({
                        success:false,
                        message:"product not found"
                  });
            }


            const cart = await Cart.findOne({user:userId, isCheckedOut:false});

            if(!cart){
                  return res.status(404).json({
                        success:false,
                        message:"cart not found"
                  });
            }

            const itemIndex = cart.items.findIndex(
                  (item) => item.product.toString() === productId.toString()
            );

            if(!itemIndex === -1){
                  return res.status(404).json({
                        success:false,
                        message:"product not found in cart"
                  });
            }

            cart.items[itemIndex].quantity = quantity;

            await cart.save();

            await cart.populate("items.product","name price discountPrice images stock");

            res.status(200).json({
                        success:true,
                        message:"cart updated succesfully",
                        cart
                  });
      } catch (error) {
            console.error("updatecartItem Error",error);
             res.status(500).json({
                        success:false,
                        message:"failed to update the cart"
            });
      }
}

export const clearCart = async (req,res)=>{
      try {
            const  userId = req.user._id;

            if(!userId){
                  return res.status(400).json({
                        success:false,
                        message:"login to proceed"
                  });
            }

            const cart = await Cart.findOne({user:userId ,isCheckedOut:false});

            if(!cart){
                  return res.status(404).json({
                        success:false,
                        message:"login to proceed"
                  });
            }
            cart.items = [];

            await cart.save();

            res.status(200).json({
                        success:true,
                        message:"cart cleared succesfully",
                        cart
                  });
      } catch (error) {
            console.error("ClearCart Error:",error);
            res.status(500).json({
                        success:false,
                        message:"failed to clear the cart"
                  });
      }
}

export const removeCartItem = async (req,res)=>{
      try {
            const userId = req.user._id;

            const { productId} = req.body;
            
            if(!userId){
                  return res.status(400).json({
                        success:false,
                        message:"login to proceed"
                  });
            }

            if(!productId){
                  return res.status(400).json({
                        success:false,
                        message:"product id reqired"
                  });
            }

            const cart = await Cart.findOne({user:userId , isCheckedOut:false});

            if(!cart){
                  return res.status(404).json({
                        success:false,
                        message:"cart not found"
                  });
            }

            const itemIndex = cart.items.findIndex(
                  (item) => item.product.toString() === productId.toString()
            );

            if(itemIndex === -1){
                  return res.status(404).json({
                        success:false,
                        message:"product not found in cart"
                  });
            }

            cart.items.splice(itemIndex,1);

            await cart.save();

            await cart.populate("items.product","name price discountprice images stock");

            res.status(200).json({
                  success:true,
                  message:"item removed from cart",
                  cart
            });
      } catch (error) {
            console.error("removecartItem error", error);
            res.status(500).json({
                  success:false,
                  message:"failed to remove item from cart"
            });
      }
}
