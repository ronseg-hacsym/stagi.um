import { Server } from "socket.io";

// @ts-ignore
import * as express from 'express';
import { createServer } from 'node:http';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174']
  }
});

server.listen(3001, () => console.log('server running at http://localhost:3001'))

const onlinePeers: any = []
const onlineSockets: any = {}

io.on('connection', (socket) => {
	console.log('a user connected')
	console.log(socket.id)

	onlineSockets[socket.id] = {socket: socket, expiry: Date.now()}

	socket.on('peer-added', (datum: any) => {
		console.log(datum)
		socket.emit(`peer-broadcast`, datum.peerID)
	})

	socket.on('online-broadcast', (id: any) => {
		console.log('id',id)
		if(onlineSockets[id]) onlineSockets[id].expiry = Date.now()
	})

	setInterval(() => {
		Object.entries(onlineSockets).map((obj: any) => {
			var TEN_SECS = 10 * 1000;
			if(((Date.now()) - obj[1].expiry) > TEN_SECS) {
				console.log('deleting ', socket.id)
				delete onlineSockets[obj[1].socket.id]
			}
		})
		
		Object.entries(onlineSockets).map(async (obj: any) => {
			console.log('online sockets',obj[1].socket.id)
			obj[1].socket.emit(`online-broadcast`, true)
		})
	}, 11000)
})

