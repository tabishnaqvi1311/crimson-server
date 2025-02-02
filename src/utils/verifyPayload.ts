import jwt from 'jsonwebtoken';
import { Payload } from '../types/Payload.js';

export default function verifyPayload(state: string, secret: string){
    try {
        return jwt.verify(state, secret) as Payload;
    } catch (e) {
        console.log(e);
        return null;
    }
}