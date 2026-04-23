import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
      {
         type:{
            type:String,
            enum:["restock","sale","return","adjustment","damaged"],
            required:true
            //restock = stock coming from supplier
            //sale = stock being bought by customer
            //adjustment
         },
         quantity:{
            type:Number,
            required:true
            //positive = stock added,
            //negative = stock removed
         },
         note:{
            type:String,
            trim:true,
            maxlength:300,
            //optional reason eh "su[plier delivery","damaged in transit"
         },
         performedBy:{
           type:mongoose.Schema.Types.ObjectId,
           ref:"User",
           required:true
           //admin or worker
         }
      },
      { timestamps:true,
            _id:true
      }
);


const  inventorySchema = new mongoose.Schema(
      {
          product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product",
            required:true,
            unique:true
          },
          currentStock:{
            type:Number,
            required:true,
            default:10,
            min:0
          },
          lowStockThreshold:{
            type:Number,
            default:10,
            min:0
          },
          isLowStock:{
            type:Boolean,
            default:false
            // auto-set by pre-save hook below
          },
          isoutOfStock:{
            type:Boolean,
            default:false    
          // auto-set by pre-save hook below
          },
          movements:[stockMovementSchema],

          updatedBy:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
            //the last admin/worker who touched this inventory record
          },
      },
      { timestamps : true}
);

//Auto-set isLowStock and isOutOfStock before every save
inventorySchema.pre("save",function(next){
      this.isoutOfStock = this.currentStock === 0;
      this.isLowStock = this.currentStock > 0 && this.currentStock <= this.lowStockThreshold;
      next();
});

// After saving inventory, keep the Product's stock field in sync
inventorySchema.post("save",async function () {
      const Product = mongoose.model("Product");
      await Product.findByIdAndUpdate(this.product,{
            stock:this.currentStock,
      });
});

export default mongoose.model("Inventory",inventorySchema);