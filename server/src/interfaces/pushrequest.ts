import { IDevice } from './../models'

export interface IPushRequest {
    devices: IDevice[]
    title: string
    subtitle: string
    content: string
    payload: any
    category: string
}