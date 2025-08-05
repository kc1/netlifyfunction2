exports.handler = async function (event) {
  console.log("Received body:", event.body);
const body = JSON.parse(event.body);
const ggValue = body.gg;
console.log("GG value:", ggValue);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello world!",
      received: event.body,
    }),
  };
};