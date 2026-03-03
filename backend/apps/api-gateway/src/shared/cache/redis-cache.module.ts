import { Module, Global } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

/**
 * RedisCacheModule — provides a Redis-backed cache service.
 * Global so any module can inject RedisCacheService without importing.
 */
@Global()
@Module({
    providers: [RedisCacheService],
    exports: [RedisCacheService],
})
export class RedisCacheModule { }
