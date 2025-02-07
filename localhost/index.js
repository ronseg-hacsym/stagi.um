const express = require('express')
const fs = require('fs')

const cors = require('cors')

const app = express()

console.log(process.env.DIRECTORY)

app.use(cors({
	origin: 'http://localhost:5173'
}))

app.use(express.json({limit: '50mb'}))

app.get('/status', async (req, res) => {
	res.status(200)
})

app.get('/preview', async (req, res) => {
	const contentNames = await fs.readdirSync(process.env.DIRECTORY)
	const files = {}
	for(let i = 0; i < contentNames.length; i++) {
		const res = await fs.statSync(process.env.DIRECTORY +"/"+contentNames[i])

		if(res.isDirectory()) {
			const fileNamesInChannel = await fs.readdirSync(process.env.DIRECTORY+"/"+contentNames[i])
			if(fileNamesInChannel.length == 0){
				files[contentNames[i]] = {
						preview: [],
						blockCount: 0
					}
			}

			for(let j = 0; j < fileNamesInChannel.length; j ++){
				const res = await fs.readFileSync(process.env.DIRECTORY + '/' + contentNames[i] + "/"+ fileNamesInChannel[j], { encoding: 'utf8', flag: 'r' })
				console.log(res)
				if(files[contentNames[i]]) {
					files[contentNames[i]].preview.push(JSON.parse(res))
				} else {
					files[contentNames[i]] = {
						preview: [],
						blockCount: fileNamesInChannel.length
					}
					files[contentNames[i]].preview.push(JSON.parse(res))
				}
			}
		}
	}

	res.send({
		files: files
	}).status(200)
})

app.get('/channel/:channelName', async (req, res) => {
	const files = {}

	const fileNamesInChannel = await fs.readdirSync(process.env.DIRECTORY +"/"+req.params.channelName)

	if(fileNamesInChannel.length == 0){
		files[req.params.channelName] = {
				viewing: [],
				blockCount: 0
			}
	}
	console.log(fileNamesInChannel)

	for(let j = 0; j < fileNamesInChannel.length; j ++){
		const res = await fs.readFileSync(process.env.DIRECTORY + '/' + req.params.channelName + "/"+ fileNamesInChannel[j], { encoding: 'utf8', flag: 'r' })
		if(files[req.params.channelName]) {
			files[req.params.channelName].viewing.push(res)
		} else {
			files[req.params.channelName] = {
				viewing: [],
				blockCount: fileNamesInChannel.length
			}
			files[req.params.channelName].viewing.push(res)
		}
	}

	res.send({
		files: files
	})
})

app.post('/addChannel', async (req,res) => {
	await fs.mkdirSync(process.env.DIRECTORY + '/'+req.body.channelName)
	res.status(200)
})

app.post('/channel/connections', async (req, res) => {
	const url = req.body.url

	const contentNames = await fs.readdirSync(process.env.DIRECTORY)
	const connections = new Set()
	const totalChannels = new Set()
	console.log(contentNames)
	for(let i = 0; i < contentNames.length; i++) {
		const res = await fs.statSync(process.env.DIRECTORY +"/"+contentNames[i])

		if(res.isDirectory()) {
			const fileNamesInChannel = await fs.readdirSync(process.env.DIRECTORY+"/"+contentNames[i])
			totalChannels.add(contentNames[i])

			for(let j = 0; j < fileNamesInChannel.length; j ++){
				const res = await fs.readFileSync(process.env.DIRECTORY + '/' + contentNames[i] + "/"+ fileNamesInChannel[j], { encoding: 'utf8', flag: 'r' })
				if(JSON.parse(res).raw.source == url) connections.add(contentNames[i])
			}
		}
	}

	res.send({
		totalChannels: Array.from(totalChannels),
		connections: Array.from(connections)
	}).status(200)
})

app.post('/addTochannel', async (req, res) => {
	console.log(req.body.payload)
	await fs.writeFileSync(process.env.DIRECTORY+"/"+req.body.payload.channel[0]+'/'+Date.now()+".json", JSON.stringify(req.body.payload.block))
	res.send({
		success: true
	}).status(200)
})

app.post('/removeChannel', async (req, res) => {
	const directory = req.body.directory
	await fs.rmSync(process.env.DIRECTORY+"/"+directory, { recursive: true, force: true });
	res.status(200)
})

app.listen(3000, () => console.log('listening'))