exports.handler = async () => {
  console.log("Hello from Netlify Function!");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello World" }),
  };
};
