import * as fs from 'fs'

const wait = (ms: any) => new Promise((res) => setTimeout(res,ms))

export const resolvers = {
  Query: {
    status: () => {
      return {status: 200}
    },
    preview: async () => {
      const contentNames = await fs.readdirSync(__dirname+'/'+process.env.DIRECTORY!)
      const files: any = []
      for(let i = 0; i < contentNames.length; i++) {
        const res = await fs.statSync(__dirname+'/'+process.env.DIRECTORY! +"/"+contentNames[i])

        if(res.isDirectory()) {
          const fileNamesInChannel: any = await fs.readdirSync(__dirname+'/'+process.env.DIRECTORY!+"/"+contentNames[i])

          if(fileNamesInChannel.length == 0){
            files.push({
                id: contentNames[i],
                preview: [],
                blockCount: fileNamesInChannel.length
              })
          }

          for(let j = 0; j < fileNamesInChannel.length; j ++){
            const res: any = await fs.readFileSync(__dirname+'/'+process.env.DIRECTORY! + '/' + contentNames[i] + "/"+ fileNamesInChannel[j], { encoding: 'utf8', flag: 'r' })
            if(files.length == i-1){
              files.push({
                id: contentNames[i],
                preview: [],
                blockCount: fileNamesInChannel.length
              })
            }

            files[i-1].preview.push(JSON.parse(res))
          }
        }
      }
      return {files: files}
    },
    channel: async (_: any, { title }: any) => {
      const files: any = []

      const fileNamesInChannel: any = await fs.readdirSync(__dirname+'/'+process.env.DIRECTORY! +"/"+title)

      for(let j = 0; j < fileNamesInChannel.length; j ++){
        const res: any = await fs.readFileSync(__dirname+'/'+process.env.DIRECTORY! + '/' + title + "/"+ fileNamesInChannel[j], { encoding: 'utf8', flag: 'r' })
        
        if(files.length == 0){
            files.push({
              id: title,
              preview: [],
              blockCount: fileNamesInChannel.length
            })
        }

        files[files.length-1].preview.push(JSON.parse(res))
      }

      if(fileNamesInChannel.length == 0){
        files.push({
            id: title,
            preview: [],
            blockCount: fileNamesInChannel.length
          })
      }

      return {files: files}
    },
    connections: async(_: any, { url }: any) => {

      const contentNames = await fs.readdirSync(__dirname + "/" + process.env.DIRECTORY!)
      const connections = new Set()
      const totalChannels = new Set()

      for(let i = 0; i < contentNames.length; i++) {
        const res = await fs.statSync(__dirname + "/" + process.env.DIRECTORY! +"/"+contentNames[i])

        if(res.isDirectory()) {
          const fileNamesInChannel = await fs.readdirSync(__dirname + "/" + process.env.DIRECTORY!+"/"+contentNames[i])
          totalChannels.add(contentNames[i])

          for(let j = 0; j < fileNamesInChannel.length; j ++){
            const res = await fs.readFileSync(__dirname + "/" + process.env.DIRECTORY + '/' + contentNames[i] + "/"+ fileNamesInChannel[j], { encoding: 'utf8', flag: 'r' })
            if(JSON.parse(res).raw.source == url) {
              connections.add(contentNames[i])
            }
          }
        }
      }

      return {
        totalChannels: Array.from(totalChannels),
        connections:Array.from(connections)
      }
    }
  },
  Mutation: {
    channel: async ( _: any, { title }: any) => {
      await fs.mkdirSync(__dirname +"/"+process.env.DIRECTORY! + '/'+title)
      await wait(2000)
      return {status: 200}
    },
    addToChannel: async (_: any, payload: any) => {
      const channel = payload.channel
      delete payload.channel
      await fs.writeFileSync(__dirname +"/"+process.env.DIRECTORY+"/"+channel+'/'+Date.now()+".json", JSON.stringify(payload))
      return {status: 200}
    },
    removeChannel: async (_: any, { title }: any) => {
      await fs.rmSync(__dirname + "/" + process.env.DIRECTORY+"/"+title, { recursive: true, force: true });
      await wait(2000)
      return {status: 200}
    }
  }
}