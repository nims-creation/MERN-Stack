import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(
      "mongodb+srv://nitesh0604.kpvys.mongodb.net/"
    )
    .then(() =>console.log("DB Connected"));
};
