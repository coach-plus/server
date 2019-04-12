export * from './user'
export * from './membership'
export * from './team'
export * from './event'
export * from './verification'
export * from './participation'
export * from './device'
export * from './invitation'
export * from './news'

export interface ITimestampable {
    createdAt?: Date
    updatedAt?: Date
}