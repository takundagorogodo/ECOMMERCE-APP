

export const pageNotFoundError = (req,res)=>{
    console.error("Page not found");
    res.status(404).json({
      success:false,
      error:"Route not found"
    });
};

export const errorHandler = (err,req,res,next)=>{
      console.error(err.message);
      console.log(err.stack);

      res.status(500).json({
            message:err.message,
            success:false
      });
};