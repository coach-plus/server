import { IDevice } from '../models'

export interface IFcmPushRequest {
    devices: IDevice[]
    title: string
    subtitle: string
    content: string
    payload: any
    category: string
}