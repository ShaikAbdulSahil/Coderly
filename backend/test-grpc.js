const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'proto', 'coderly.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const coderlyProto = grpc.loadPackageDefinition(packageDefinition).coderly;
const client = new coderlyProto.AuthService('localhost:50051', grpc.credentials.createInsecure());

console.log('Sending Register Request to gRPC...');
client.Register({ username: 'grpc-user', email: 'grpc@test.com', password: 'password123' }, (error, response) => {
    if (error) {
        console.error('gRPC Error Details:', JSON.stringify(error, null, 2));
        console.error('gRPC Error Message:', error.message);
    } else {
        console.log('Success:', response);
    }
});
