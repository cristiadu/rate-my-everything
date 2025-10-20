export const enum HealthMessage {
    ALL_SYSTEMS_OPERATIONAL = 'All systems operational',
    SOME_SYSTEMS_ISSUES = 'Some systems are experiencing issues',
    OFFLINE = 'Service is offline'
}

export const enum HealthStatus {
    HEALTHY = 'healthy',
    UNHEALTHY = 'unhealthy',
    OFFLLINE = 'offline'
}

export class ComponentHealth {
    status: HealthStatus
    message?: string

    constructor(status: HealthStatus, message?: string) {
        this.status = status
        this.message = message
    }
}

export class Health {
    status: HealthStatus
    uptime: number
    timestamp: string
    message?: string
    services?: {
        [key: string]: ComponentHealth
    }

    constructor(
        status: HealthStatus,
        uptime: number,
        timestamp: string,
        message?: string,
        services?: { [key: string]: ComponentHealth }
    ) {
        this.status = status
        this.uptime = uptime
        this.timestamp = timestamp
        this.message = message
        this.services = services
    }
}
