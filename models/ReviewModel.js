import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
      {
         user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
         },
         product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product",
            required:true
         },
         rating:{
            type:Number,
            required:true,
            min:1,
            max:5
         },
         title:{
            type:String,
            trim:true,
            maxlength:100
         },
         comment:{
            type:String,
            trim:true,
            maxlength:100
         },
         isVerifiedPurchase:{
            type:Boolean,
            default:false
         },
         isdeleted:{
            type:Boolean,
            default:false
         },
      },
      { timestamps : true}
);

reviewSchema.index({ user :1 , product : 1}, { unique : true});

reviewSchema.post("save",async function (){
      const Product = mongoose.model("Product");

      const result = await mongoose.model("Review").aggregate([
            {$match: {product: this.product ,isdeleted :false} },
            {
                  $group:{
                        _id:"$product",
                        average:{ $avg:"$rating"},
                        count:{ $sum},
                  },
            },
      ]);

      if(result.length> 0){
            await process.findByIdAndUpdate(this.product, {
                  "ratings.average":Math.round(result[0].average * 10) / 10,
                  "ratings.count":result[0].count
            });
      }
});

reviewSchema.post("findOneAndDelete",async function(doc){
      if(!doc) retuen;

      const Product = mongoose.model("Product");

      const result = await mongoose.model("Review").aggregate([
            {$match: {product: doc.product ,isdeleted : false}},
            {
                  $group:{
                        _id:"$product",
                        average:{ $avg:"$rating"},
                        count: {$sum : 1},
                  },
            },
      ]);

      if(result.length > 0){
            await Product.findByIdAndUpdate(doc,product,{
                  "ratings.average":Math.round(result[0].average * 10) / 10,
                  "ratings.count":result[0].count,
            });
      }else{
            //no reviews left -- rest to zero
            await Product.findByIdAndUpdate(doc,product,{
                  "ratings.average":0,
                  "ratings.count":0
            });
      }
});


export default mongoose.model('Review',reviewSchema);