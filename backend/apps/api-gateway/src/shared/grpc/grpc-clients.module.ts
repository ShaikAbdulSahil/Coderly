import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

const PROTO_PATH = join(__dirname, '../../../../proto/coderly.proto');

/**
 * GrpcClientsModule — registers gRPC clients for all internal services.
 * Global so any feature module can inject 'AUTH_PACKAGE', 'PROBLEM_PACKAGE', etc.
 */
@Global()
@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'AUTH_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'coderly',
                    protoPath: PROTO_PATH,
                    url: `${process.env.AUTH_GRPC_HOST || 'localhost'}:${process.env.AUTH_GRPC_PORT || '50051'}`,
                },
            },
            {
                name: 'PROBLEM_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'coderly',
                    protoPath: PROTO_PATH,
                    url: `${process.env.PROBLEM_GRPC_HOST || 'localhost'}:${process.env.PROBLEM_GRPC_PORT || '50052'}`,
                },
            },
            {
                name: 'SUBMISSION_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'coderly',
                    protoPath: PROTO_PATH,
                    url: `${process.env.SUBMISSION_GRPC_HOST || 'localhost'}:${process.env.SUBMISSION_GRPC_PORT || '50053'}`,
                },
            },
            {
                name: 'EXECUTION_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'coderly',
                    protoPath: PROTO_PATH,
                    url: `${process.env.EXECUTION_GRPC_HOST || 'localhost'}:${process.env.EXECUTION_GRPC_PORT || '50054'}`,
                },
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class GrpcClientsModule { }
