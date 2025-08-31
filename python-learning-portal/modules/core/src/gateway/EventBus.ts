/**
 * Event Bus for Inter-Module Communication
 * 
 * Allows modules to communicate without tight coupling
 */

import { EventBus } from '../types/ModuleTypes';

export class CoreEventBus implements EventBus {
    private listeners = new Map<string, Set<Function>>();
    private eventHistory: Array<{ event: string; data: any; timestamp: Date }> = [];

    /**
     * Emit an event to all listening modules
     */
    emit(event: string, data: any): void {
        // Record event in history
        this.eventHistory.push({
            event,
            data,
            timestamp: new Date()
        });

        // Keep only recent events (last 1000)
        if (this.eventHistory.length > 1000) {
            this.eventHistory.shift();
        }

        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`❌ Error in event listener for "${event}":`, error);
                }
            });
        }

        console.log(`📡 Event emitted: ${event} (${listeners?.size || 0} listeners)`);
    }

    /**
     * Listen for events from other modules
     */
    on(event: string, handler: (data: any) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event)!.add(handler);
        console.log(`🎧 New listener registered for event: ${event}`);
    }

    /**
     * Remove event listener
     */
    off(event: string, handler: (data: any) => void): void {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.delete(handler);
            if (listeners.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Listen for an event only once
     */
    once(event: string, handler: (data: any) => void): void {
        const onceWrapper = (data: any) => {
            handler(data);
            this.off(event, onceWrapper);
        };

        this.on(event, onceWrapper);
    }

    /**
     * Get all registered event types
     */
    getEventTypes(): string[] {
        return Array.from(this.listeners.keys());
    }

    /**
     * Get listener count for an event
     */
    getListenerCount(event: string): number {
        return this.listeners.get(event)?.size || 0;
    }

    /**
     * Get recent event history
     */
    getEventHistory(limit: number = 100): Array<{ event: string; data: any; timestamp: Date }> {
        return this.eventHistory.slice(-limit);
    }

    /**
     * Clear all listeners
     */
    removeAllListeners(): void {
        this.listeners.clear();
        console.log('🧹 All event listeners removed');
    }

    /**
     * Remove all listeners for a specific event
     */
    removeAllListenersForEvent(event: string): void {
        this.listeners.delete(event);
        console.log(`🧹 All listeners removed for event: ${event}`);
    }

    /**
     * Get event bus statistics
     */
    getStatistics() {
        return {
            totalEvents: this.listeners.size,
            totalListeners: Array.from(this.listeners.values())
                .reduce((sum, listeners) => sum + listeners.size, 0),
            eventHistory: this.eventHistory.length,
            events: Array.from(this.listeners.entries()).map(([event, listeners]) => ({
                event,
                listenerCount: listeners.size
            }))
        };
    }
}

/**
 * Common event types that modules can use
 */
export const CORE_EVENTS = {
    // User events
    USER_LOGGED_IN: 'user.logged_in',
    USER_LOGGED_OUT: 'user.logged_out',
    USER_UPGRADED: 'user.upgraded',
    USER_DOWNGRADED: 'user.downgraded',

    // Exercise events
    EXERCISE_COMPLETED: 'exercise.completed',
    EXERCISE_STARTED: 'exercise.started',
    CODE_EXECUTED: 'exercise.code_executed',

    // Payment events
    PAYMENT_SUCCESS: 'payment.success',
    PAYMENT_FAILED: 'payment.failed',
    SUBSCRIPTION_CREATED: 'payment.subscription_created',
    SUBSCRIPTION_CANCELLED: 'payment.subscription_cancelled',

    // System events
    MODULE_LOADED: 'system.module_loaded',
    MODULE_ERROR: 'system.module_error',
    DATABASE_CONNECTED: 'system.database_connected',

    // Analytics events
    PAGE_VIEW: 'analytics.page_view',
    USER_ACTION: 'analytics.user_action',
    CONVERSION: 'analytics.conversion',

    // Content events
    CONTENT_UPDATED: 'content.updated',
    NEW_EXERCISE_ADDED: 'content.exercise_added'
} as const;