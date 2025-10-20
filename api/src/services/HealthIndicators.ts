import { ComponentHealth, Health, HealthMessage, HealthStatus } from "@/models/Health"
import { DBConnection } from ".."

export interface HealthIndicator {
    name: string;
    checkHealth(): Promise<{ [key: string]: ComponentHealth }>;
}

export class AppHealthIndicator implements HealthIndicator {
    name = 'app'

    async checkHealth(): Promise<{ [key: string]: ComponentHealth }> {
        return { [this.name]: new ComponentHealth(HealthStatus.HEALTHY) }
    }
}

export class DatabaseHealthIndicator implements HealthIndicator {
    name = 'database'

    async checkHealth(): Promise<{ [key: string]: ComponentHealth }> {
        const isDbConnected = DBConnection.isInitialized
        const status = isDbConnected ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY
        const message = isDbConnected ? undefined : 'Database connection failed'
        return { [this.name]: new ComponentHealth(status, message) }
    }
}

// Health check runner
export const runHealthChecks = async (): Promise<Health> => {
    // Get all registered health indicators
    const indicators: HealthIndicator[] = [
        new AppHealthIndicator(),
        new DatabaseHealthIndicator(),
        // Add other indicators here
    ]

    const checks = await Promise.all(
        indicators.map((indicator) => indicator.checkHealth())
    )

    const status: HealthStatus = checks
        .flatMap(obj => Object.values(obj))
        .every(component => component.status === HealthStatus.HEALTHY)
        ? HealthStatus.HEALTHY
        : HealthStatus.UNHEALTHY

    const services: { [key: string]: ComponentHealth } = Object.assign(
        {},
        ...checks
    )

    return new Health(
        status,
        process.uptime(),
        new Date().toISOString(),
        status === HealthStatus.HEALTHY ? HealthMessage.ALL_SYSTEMS_OPERATIONAL : HealthMessage.SOME_SYSTEMS_ISSUES,
        services,
    )
}
