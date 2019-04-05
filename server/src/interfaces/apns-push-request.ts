import { IDevice } from '../models'

export interface IApnsPushRequest {
    devices: IDevice[]
    title: string
    subtitle: string
    content: string
    payload: any
    category: string
}