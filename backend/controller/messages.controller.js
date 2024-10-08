import Conversation from "../models/conversation.model.js";
import Message from "../models/messages.model.js";
import { getreceiversocketId } from "../socket/socket.js";
import { io } from '../socket/socket.js';

export const sendmessage = async(req,res) => {
    try {
        
        const { message } = req.body
        const { id: receiverId } = req.params
        const senderId = req.user._id 

        const conversation = await Conversation.findOne({
            participants: {$all: [senderId,receiverId]}
        })


        if (!conversation){
            conversation = await Conversation.create({
                participants: [senderId,receiverId]
            })
        }

        const newMessage = new Message({
            messagecontent: message,
            senderId,
            receiverId
        })

        if (newMessage){
            conversation.messages.push(newMessage._id)
        }

        await Promise.all([conversation.save(), newMessage.save()])

        const receiversocketId = getreceiversocketId(receiverId)
        if (receiversocketId) {
            io.to(receiversocketId).emit("newMessage", newMessage)
        }

        res.status(201).json({message: "Message sent successfuly"})

    } catch (error) {
        console.error("Error sending message:", error.message);
        res.status(500).json({ error: "Server error" });
    }
}

export const getmessage = async(req,res) => {
    try {

        const { id: convpartnerId } = req.params
        const senderId = req.user._id 

        if (convpartnerId == "undefined") {
            return
        }
        
        const conversation = await Conversation.findOne({
            participants: {$all: [senderId,convpartnerId]}
        }).populate("messages")

        if (!conversation){
            conversation = await Conversation.create({
                participants: [senderId,convpartnerId]
            })
        }
    
        const messages  = conversation.messages

        res.status(200).json({messages})

    } catch (error) {
        console.error("Error retrieving message:", error.message);
        res.status(500).json({ error: "Server error" });
    }


}