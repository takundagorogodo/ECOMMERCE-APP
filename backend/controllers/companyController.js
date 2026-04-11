import Company  from "../models/CompanyModel.js"

export const createCompany = async (req,res)=>{
      try {
            if(req.user.role !=="admin"){
                   return res.status(400).json({
                        success:false,
                        message:"Only admins can create a company"
                  });
            }
            const { 
                  companyName,
                  companyEmail,
                  phone,
                  since,
                  adress
            } = req.body;

            if(!companyEmail||!companyName||!phone||!since||!adress){
                  return res.status(400).json({
                        success:false,
                        message:"all fields are required"
                  });
            }
              
            const existingCompany = await Company.findOne();

            if(existingCompany){
                   return res.status(400).json({
                        success:false,
                        message:"a company already exists"
                  });
            };

            const company = await Company.create({
                  companyEmail,
                  companyName,
                  phone,
                  adress,
                  since
            });

            res.status(200).json({
                  success:true,
                  message:"company created succesfully",
                  company
            });

      } catch (error) {
            console.error("failed to create a Company",error);
            return res.status(500).json({
                  message:"failed to create company",
                  success:false
            });
      }
}

export const editCompanyDetails = async (req,res)=>{
      try {
            if(req.user.role !=="admin"){
                  return res.status(403).json({
                        success:false,
                        message:"only admin can edit company deteils"
                  });
            }
            const companyId  = req.params.id;

            const company = await Company.findById(companyId);

            if(!company){
                  return res.status(400).json({
                        success:false,
                        message:"company not found"
                  });
            }

            const updatedCompany = await Company.findByIdAndUpdate(
                  companyId,
                  req.body,
                  { new:true , runValidators:true}
            );

            res.status(201).json({
                  message:"details updated successfully",
                  success:true,
                  company:updatedCompany
            });

      } catch (error) {
            console.error("failed to update company details");
            res.status(500).json({
                 success:false,
                 message: "failed to update company details"
            });
      }
}