const redis = require("redis");

const redisClient = redis.createClient({
    url: "redis://127.0.0.1:6379"
});


redisClient.on("connect", () => {

    console.log(
        "Redis connected successfully"
    );
});


redisClient.on("error", (err) => {

    console.log(
        "Redis Error:",
        err
    );
});


const connectRedis = async () => {

    if (!redisClient.isOpen) {

        await redisClient.connect();
    }
};

module.exports = {
    redisClient,
    connectRedis
};