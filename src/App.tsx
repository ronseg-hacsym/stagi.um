import { useState, useEffect } from 'react'
import './App.css'

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

import { Fluence, kras } from '@fluencelabs/js-client'
import { recentGossip, registerStagium, explore as exploreP2P } from './fluence/main'

import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

import { io } from "socket.io-client";
// @ts-ignore
import Modal from 'react-modal';
import axios from 'axios'
import * as ethers from 'ethers';

import { BrowserLevel } from 'browser-level';

import {samples} from './samples'

// console.log(samples)

const defaultOptions: any = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
}

const client = new ApolloClient({
  uri: 'http://localhost:4001/channel/graphql',
  cache: new InMemoryCache(),
  defaultOptions: defaultOptions
});

// @ts-ignore
import ob from 'urbit-ob'

import Tab from 'react-bootstrap/Tab';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import Tabs from 'react-bootstrap/Tabs';

// @ts-ignore
import MultiSelect from  'react-multiple-select-dropdown-lite'
import  'react-multiple-select-dropdown-lite/dist/index.css'
// @ts-ignore
import { Sparklines, SparklinesLine, SparklinesReferenceLine} from 'react-sparklines';

import 'bootstrap/dist/css/bootstrap.min.css';
import '@urbit/sigil-js'

const HOST = 'http://localhost:3000'

// Helper functions
const dotProduct = (a: any, b: any) => {
  let product = 0;
  for (let i = 0; i < a.length; i++) {
    product += a[i] * b[i];
  }

  return product;
};

const magnitude = (vector: any) => {
  let sum = 0;
  for (let value of vector) {
    sum += value * value;
  }
  return Math.sqrt(sum);
};

const cosineSimilarity = (a: any, b: any) => {
  return dotProduct(a, b) / (magnitude(a) * magnitude(b));
};

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};

const Sigil = ({ config }: any) => {
 return (
   <>
     {/*@ts-ignore*/}
     <urbit-sigil {...config} />
   </>
 )
}

const SigilSmall = ({ config }: any) => {
  return(
    <span style={{marginBottom: '-20px', position: 'absolute'}}>
      {/*@ts-ignore*/}
       <urbit-sigil {...config} />
    </span>
  )
}

const onlinePeers: any = []
let socketID: any = null

let db: any;

function App() {
  const [isGraph, setIsGraph] = useState<any>(false)
  const [sigil, setSigil] = useState<any>(null)
  const [tab, setTab] = useState<any>('feed')
  const [explore, setExplore] = useState<any>([])
  const [feed, setFeed] = useState<any>([])
  const [profilePreviews, setProfilePreviews] = useState<any>([])
  const [viewingBlock, setViewingBlock] = useState<any>(null)

  useEffect(() => {
    if(sigil){
      db = new BrowserLevel(sigil, { valueEncoding: 'json' })
    }
  },[sigil])

  const handleMetaMaskConnect = async () => {
    // @ts-ignore
    if (typeof window.ethereum !== 'undefined') {
      try {
        // @ts-ignore
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });

        const provider = new ethers.JsonRpcProvider(
          "https://nodes.sequence.app/mainnet"
        );
        
        const azimuthContractAddress = '0x223c067f8cf28ae173ee5cafea60ca44c335fecb';
        
        const azimuthAbi = [
          'function getOwner(uint32 point) view returns (address)',
          'function getOwnedPoints(address owner) view returns (uint32[])',
        ];
        
        const azimuthContract = new ethers.Contract(azimuthContractAddress, azimuthAbi, provider);

        function pointToPatp(point: any) {
          return ob.patp(point);
        }

        const urbitIds = await azimuthContract.getOwnedPoints(accounts[0]);

        if(urbitIds != ''){
          const urbitId = pointToPatp(Number(urbitIds));
          console.log(`Urbit ID for point ${urbitIds}: ${urbitId}`);
          setSigil(urbitId)
        }else {
          alert('No Urbit ID associated with this address')
        }
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      console.error('MetaMask is not installed');
    }
  }

  useEffect(() => {
    
    setTimeout(async () => {
      await Fluence.connect(kras[0],
        {
          debug: { printParticleId: true },
        }
      )

      registerStagium({
        explore: async () => {
          if(isGraph){
            const res = await client.query({
              query: gql`
                query ExampleQuery {
                  preview {
                    files {
                      id
                      preview {
                        avg_vector
                        raw {
                          connections
                          title
                          source
                        }
                      }
                    }
                  }
                }
              `,
            })
            console.log(res)
            return JSON.stringify(res)
          }else {
            const res = await axios.get('http://localhost:3000/preview')
            console.log(res)
            return JSON.stringify(res)
          }
        }, 
        train: () => {
          console.log('time to train')
          return true
        }, 
        isOnlineCheck: () => {
          console.log('is online')
          return true
        }, 
        recentGossip: async (feedBlock: any) => {
          console.log(feedBlock)
          const entries: any = await db.iterator().all()
          db.put(entries.length, feedBlock)
          return true
        }
      })

      const peerID = await Fluence.getClient().getPeerId()
      console.log(peerID)

      const socket = io("https://stagi.um.ngrok.dev");

      socket.on("connect", () => {
        socket.emit('peer-added', {peerID: peerID})
        console.log(socket.id); 
        socketID = socket.id
      });

      socket.on('peer-broadcast', (packet: any) => {
          onlinePeers.push(packet)
          console.log(packet)
      })

      socket.on('online-broadcast', (_: any) => {
          socket.emit('online-broadcast', socketID)
      })
    }, 0)
    return () => {}
  }, [isGraph])

  const [newPreview, setNewPreview] = useState<any>(0);
  const [modalIsOpen, setIsOpen] = useState<any>(false);
  const [viewingChannel, setViewingChannel] = useState<any>(null)
  const [viewingBlockProfile, setViewingBlockProfile] = useState<any>(null)
  const [viewingChannelBlocks, setViewingChannelBlocks] = useState<any>([])
  const [trainIncrement, setTrainIncrement] = useState<any>(0)

  useEffect(() => {

    setTimeout(async () => {
        const explores: any  = []
        const feedImages: any  = samples

        const vectors: any  = []
        const elements : any = [1,2,3,10,11,15,16,17,18,23,52]
      if(tab && trainIncrement > 0){

        let res;

        for(let i = 0; i< onlinePeers.length; i++){
          try {

            const preview = JSON.parse(await exploreP2P(onlinePeers[i]))
            const files = Object.entries(preview.data.files)
            files.map((element: any) => {
              element[1].preview.map((el: any) => {
                vectors.push(el)
              })
            })

          }catch(err){
            setIsGraph(true)
          }
        }

        res = await axios.get('http://localhost:3000/preview')

        const my_channels: any  = {}
        const reward_channels: any  = {}
        const virtual_channels: any  = {}
        Object.keys(res.data.files).map((key: any) =>{
          my_channels[key] = {raw: []}
          virtual_channels[key] = []
          Object.keys(res.data.files).map((innerKey: any) => {
            if(!reward_channels[key]) {
              reward_channels[key] = {}
            }
            reward_channels[key][innerKey] = 0
          })
        } )

        const random_x: any  = 0.4

        const env : any = {
          states: virtual_channels, // or vectors
          actions: Object.keys(virtual_channels),
          rewards: reward_channels
        }

          let channel;
          //==== manual add 1-7 blocks

          Object.entries(res.data.files).map((entry: any) => {
            entry[1].preview.map((element: any) => {
              my_channels[entry[0]].raw.push(element)
            })
          })

            channel = Object.entries(my_channels)[Math.round(Math.random()*(Object.entries(my_channels).length-1))][0]

          //===== train
          // get 10 to train
          for(let j = 0; j < Object.entries(my_channels).length; j++){
            // update rewards
            const inspecting_channel = Object.entries(my_channels)[Math.round(Math.random()*(Object.entries(my_channels).length-1))][0]
            const reward_vector = vectors[Math.round((vectors.length-1)*Math.random())]
            virtual_channels[inspecting_channel].push(reward_vector)

            // calculate vector average
            let vector_avg_new = Array(virtual_channels[inspecting_channel][0].avg_vector.length).fill(0)
            my_channels[inspecting_channel].raw.map((element: any) => {
              element.avg_vector.map((el: any, i: any) => {
                vector_avg_new[i] += el
              })
            })

            // delta, update rewards
            if(my_channels[inspecting_channel].raw.length > 0){
              env.rewards[channel][inspecting_channel] += cosineSimilarity(my_channels[inspecting_channel].raw[0].avg_vector, vector_avg_new.map((el: any) => el / virtual_channels[inspecting_channel].length)) / 2
            }
          }

          Object.keys(my_channels).map((channel: any) => {
            my_channels[channel].raw.map((el: any) => {
              let vector_avg_new = Array(el.avg_vector.length).fill(0)
              el.avg_vector.map((element: any, i: any) => {
                vector_avg_new[i] += element
              })
              my_channels[channel].channel_avg_vector = vector_avg_new.map((element: any) => element / el.avg_vector.length)
            })
          })

          const explore: any = []

          let j = 0

          //===== loop on less
          while(explore.length < 20 && j < vectors.length){
            const potential: any = []
            Object.keys(my_channels).map((potentialChannel: any) => {
              if(my_channels[potentialChannel].raw.length > 0){
                my_channels[potentialChannel].raw.map((_: any) => {
                  potential.push({
                    score: cosineSimilarity(my_channels[potentialChannel].channel_avg_vector, vectors[j].avg_vector)*env.rewards[channel][potentialChannel],
                    element: vectors[j]
                  })
                })
              }

            })

            potential.sort((a: any,b: any) => {
                return (new Date(b.score) as any) - (new Date(a.score) as any);
            });

            if(potential.length > 0 && potential[0].score > 0) explore.push(potential[0].element)
            if(potential.length > 1 && potential[1].score > 0) explore.push(potential[1].element)

            j++
          }


          //======== random X
          // console.log(explore)
          for(let j = 0; j < explore.length*random_x; j++){
            // get element
            const element: any = vectors[j]
            let in_batch = false
            let k = 0
            // check if element is in batch already, if so loop, else console
            while(!in_batch && k<explore.length){ 
              if(explore[k] === element){
                in_batch = true
              }
              k++
            }

            if(!in_batch){
              explore.push(element)
            }
          }

        const exclusive: any = new Set()
          for(let i = 0; i< explore.length; i++){
            // console.log(explore[i])
            try{
              exclusive.add(JSON.stringify(explore[i]))
            }catch(err){

            }
          }
          // console.log(exclusive)
          const learned: any = []
        const ex_explore: any = Array.from(exclusive).map((el: any)=>JSON.parse(el))
        if(ex_explore.length > 0) {
          for(let i = 0; i < ex_explore.length; i++){
            // console.log(ex_explore)
            ex_explore[i].raw.source.includes('http') && learned.push(<Col xs={2}><div  className='card' onClick={() => setViewingBlock(JSON.stringify(ex_explore[i]))}>
                     {
                       <img style={{objectFit: 'contain', alignContent: 'center',maxHeight: '100%', marginTop: '50%', transform: 'translateY(-50%)'}} src={ex_explore[i].raw.source}/>
                     }
                   </div></Col>)
          }
        
        }

        if(await localStorage.getItem('rewards')){
          console.log(await localStorage.getItem('rewards'))
          const data: any  = JSON.parse(await localStorage.getItem('rewards')!)
          data.push(env.rewards)
          localStorage.setItem('rewards', JSON.stringify(data))
        }else {
          localStorage.setItem('rewards', JSON.stringify([env.rewards]))
        }

        const data: any = JSON.parse(await localStorage.getItem('rewards')!)

        const diffs: any = []
        for(let i = 0; i < data.length; i++){
          // console.log(Object.values(data[i]).reduce((total: any, el: any) => {return Object.values(el).reduce((total: any,val: any) => total+val) + total}, 0))
          // @ts-ignore
          diffs.push(Object.values(data[i]).reduce((total: any, el: any) => {return Object.values(el).reduce((total: any,val: any) => total+val) + total}, 0) / Object.values(Object.values(data[i])).length as any)
        }

        setLearningLocal(diffs)
        setExplore(learned)
      // }
      } else {
        const data: any = JSON.parse(await localStorage.getItem('rewards')!)

        const diffs: any = []
        for(let i = 0; i < data.length; i++){
          console.log(Object.values(data[i]).reduce((total: any, el: any) => {return Object.values(el).reduce((total: any,val: any) => total+val) + total}, 0))
          // @ts-ignore
          diffs.push(Object.values(data[i]).reduce((total: any, el: any) => {return Object.values(el).reduce((total: any,val: any) => total+val) + total}, 0) / Object.values(Object.values(data[i])).length as any)
        }

        setLearningLocal(diffs)
          for(let i = 0; i < elements.length; i++){

            try {
              console.log(feedImages[elements[i]])
              // if(await axios.get(feedImages[i].raw.source)){
                feedImages[elements[i]].raw.source.includes('http') && explores.push(<Col xs={2}><div className='card' onClick={() => setViewingBlock(feedImages[elements[i]])}>
                    {
                      <img style={{objectFit: 'contain', alignContent: 'center',maxHeight: '100%', marginTop: '50%', transform: 'translateY(-50%)'}} src={feedImages[elements[i]].raw.source}/>
                    }
                    
                  </div></Col>)
            }catch(err){}
        setExplore(explores)

      }
    }
    }, 0)
  }, [tab, trainIncrement])

  useEffect(() => {
    setTimeout(async () => {
      if(db){

      const entries: any = (await db.iterator().all()).map((el: any) => el[1])

      let feedImages = entries
      const set = new Set()

      feedImages.map((el: any) => {
        if(el.channel) set.add(el.channel)
      })
      const channels = Array.from(set)
      const feedInChannels = channels.map((channel: any) => feedImages.filter((el: any) => el.channel == channel))
      const feedImagesBatched = []
      for(let k = 0; k < feedInChannels.length; k++){
        let batch = 1
        let j = 0;
        feedImages = feedInChannels[k]
        for(let i = 0; i < feedImages.length; i = j) {
          const row = []
          row.push(
            <Col xs={3} className="justify-content-md-center">
            <div className='card' onClick={() => setViewingBlock(feedImages[i])}>
              <img style={{objectFit: 'contain', maxHeight: '100%', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={feedImages[i].source}/>
            </div>
            </Col>
          )

          if(1==feedImages.length){
            feedImagesBatched.push(
                  {
                    time: feedImages[j].timestamp,
                    element: <Row className="justify-content-md-center" style={{margin: 'auto', alignContent: 'center', fontFamily: 'Courier', width: '100%'}}>
                      
                      <Row className="justify-content-md-center" style={{margin: 'auto', alignContent: 'center', fontFamily: 'Courier', width: '100%'}}>
                        <span style={{position: 'relative',  bottom: '10px', left: '5px'}}><SigilSmall config={{
                             point: sigil,
                             size: 25,
                             background:'white', 
                             foreground:'black',
                             detail:'default',
                             space:'none',
                        }}/>&nbsp;&nbsp;&nbsp;{feedImages[j].author} added {row.length} blocks to {feedImages[j].channel}</span>
                      </Row>
                      {row}
                    </Row>
                  }
                  )
          }
          for(j = i + 1; j < feedImages.length; j++){
            const HOURS = (batch)*4 * 60 * 60 * 1000;
            if((Date.now()) - feedImages[j].timestamp < HOURS){
              row.push(
                <Col xs={3}><div className='card' onClick={() => setViewingBlock(feedImages[j])}>

                  <img style={{objectFit: 'contain', maxHeight: '100%', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={feedImages[j].source}/>
                  </div>
                </Col>
              )

              if((j+1) >= feedImages.length){
                 feedImagesBatched.push(
                  {
                    time: feedImages[j].timestamp,
                    element: <Row className="justify-content-md-center" style={{margin: 'auto', alignContent: 'center', fontFamily: 'Courier', width: '100%'}}>
                      
                      <Row className="justify-content-md-center" style={{margin: 'auto', alignContent: 'center', fontFamily: 'Courier', width: '100%'}}>
                        <span style={{position: 'relative', bottom: '10px', left: '5px'}}><SigilSmall config={{
                             point: sigil,
                             size: 25,
                             background:'white', 
                             foreground:'black',
                             detail:'default',
                             space:'none',
                        }}/>&nbsp;&nbsp;&nbsp;~ronseg-hacsym added {row.length} blocks to {feedImages[j].channel}</span>
                      </Row>
                      {row}
                    </Row>
                  }
                  )
                break;
              }
              continue;
            }else {
              batch++
              feedImagesBatched.push({
                time: feedImages[j].timestamp,
                element: <Row className="justify-content-md-center" style={{margin: 'auto', alignContent: 'center', fontFamily: 'Courier', width: '100%'}}>
                  
                  <Row className="justify-content-md-center" style={{margin: 'auto', alignContent: 'center', fontFamily: 'Courier', width: '100%'}}>
                    <span style={{position: 'relative', bottom: '10px', left: '5px'}}><SigilSmall config={{
                             point: sigil,
                             size: 25,
                             background:'white', 
                             foreground:'black',
                             detail:'default',
                             space:'none',
                        }}/>&nbsp;&nbsp;&nbsp;~ronseg-hacsym added {row.length} blocks to {feedImages[j].channel}</span>
                  </Row>
                  {row}
                </Row>
              })
              break
            }
          }
        }
      }

      feedImagesBatched.sort((a: any,b: any) => {
        return (new Date(b.time) as any) - (new Date(a.time) as any);
      });

      setFeed(feedImagesBatched.map((el) => el.element))
      if(!viewingBlockProfile || ! viewingBlock){
        setTimeout(async () => {
          const profilePreviewsRaw: any = []
          try {

          const res = await axios.get('http://localhost:3000/preview')

          Object.entries(res.data.files).map((element: any) => {
            profilePreviewsRaw.push(
              <Row className="justify-content-md-center" style={{ border: '1px solid lightgrey',margin: '5px auto', padding: '10px',alignContent: 'center', fontFamily: 'Courier', width: '80%'}}>
                
                <Col  xs={3}><div onClick={() => setViewingChannel(element[0])} className='card-preview'>{element[0]}<br/><br/><span style={{fontSize: '15px'}}>{element[1].blockCount} blocks</span></div></Col>
                <Col xs={3}>
                  {element[1].preview[0]&&<div className='card' onClick={() => setViewingBlock(element[1].preview[0])}>
                    <img style={{objectFit: 'contain', maxHeight: '100%',alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={element[1].preview[0].raw.source}/>
                  </div>}
                </Col>
                <Col xs={3}>
                  {element[1].preview[1]&&<div className='card' onClick={() => setViewingBlock(element[1].preview[1])}>
                    <img style={{objectFit: 'contain', maxHeight: '100%', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={element[1].preview[1].raw.source}/>
                  </div>}
                </Col>
                <Col xs={3}>
                  {element[1].preview[2]&&<div className='card' onClick={() => setViewingBlock(element[1].preview[2])}>
                    <img style={{objectFit: 'contain', maxHeight: '100%', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={element[1].preview[2].raw.source}/>
                  </div>}
                </Col>
              </Row>
            )
          })

          setProfilePreviews(profilePreviewsRaw)
          } catch(err) {
            setIsGraph(true)

            const res = await client
            .query({
              query: gql`
                query ExampleQuery {
                  preview {
                    files {
                      blockCount
                      id
                      preview {
                        raw {
                          connections
                          title
                          source
                        }
                      }
                    }
                  }
                }
              `,
            })

            res.data.preview.files.map((element: any) => {
            profilePreviewsRaw.push(
              <Row className="justify-content-md-center" style={{ border: '1px solid lightgrey',margin: '5px auto', padding: '10px',alignContent: 'center', fontFamily: 'Courier', width: '80%'}}>
                <Col  xs={3}><div onClick={() => setViewingChannel(element.id)} className='card-preview'>{element.id}<br/><br/><span style={{fontSize: '15px'}}>{element.blockCount} blocks</span></div></Col>
                <Col xs={3}>
                  {element.preview[0]&&<div className='card' onClick={() => setViewingBlock(element.preview[0])}>
                    <img style={{objectFit: 'contain', maxHeight: '100%',alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={element.preview[0].raw.source}/>
                  </div>}
                </Col>
                <Col xs={3}>
                  {element.preview[1]&&<div className='card' onClick={() => setViewingBlock(element.preview[1])}>
                    <img style={{objectFit: 'contain', maxHeight: '100%', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={element.preview[1].raw.source}/>
                  </div>}
                </Col>
                <Col xs={3}>
                  {element.preview[2]&&<div className='card' onClick={() => setViewingBlock(element.preview[2])}>
                    <img style={{objectFit: 'contain', maxHeight: '100%', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={element.preview[2].raw.source}/>
                  </div>}
                </Col>
              </Row>
            )
          })

          setProfilePreviews(profilePreviewsRaw)
          }
        }, 0)
      }
      }

    }, 0)

  }, [sigil, tab, viewingChannel, modalIsOpen, viewingBlockProfile, tab, viewingBlock]) // /preview

  useEffect(() => {
    if(viewingChannel){
      setTimeout(async () => {
        if(isGraph&&viewingChannel){
          const res = await client
            .query({
              query: gql`
                query ExampleQuery($title: String) {
                  channel(title: $title) {
                    files {
                      preview {
                        avg_vector
                        raw {
                          source
                          title
                        }
                      }
                    }
                  }
                }
              `,
              variables: {
                title: viewingChannel
              }
            })

          setViewingChannelBlocks(res.data.channel.files[0].preview.map((el: any) => {
            console.log(el.raw.source)
            return <Col xs={3}><div className='card' onClick={() => {setViewingBlockProfile(el.raw)}}>
                <img style={{objectFit: 'contain', maxHeight: '100%',alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={el.raw.source}/>
              </div></Col>
          }))

        } else {
           const res = await axios.get(HOST + '/channel/' + viewingChannel)
          setViewingChannelBlocks(res.data.files[viewingChannel].viewing.map((el: any) => {
            console.log(el)
            return <Col xs={3}><div className='card' onClick={() => {setViewingBlockProfile(el.raw)}}>
                <img style={{objectFit: 'contain', maxHeight: '100%',alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={JSON.parse(el).raw.source}/>
              </div></Col>
          }))
        }
        
      }, 0)
    }
    setViewingChannelBlocks([])
  }, [viewingChannel,newPreview, viewingBlock, viewingBlockProfile, sigil, isGraph])


  const [learningLocal, setLearningLocal] = useState([])

  const handleOnchange  =  async (val: any)  => {

    const channels = val.split(',')
    
    const arr = channels.filter((x: any) => !viewingProfileDefaultValues.map((el: any) => el.value).includes(x))

    console.log(await axios.post(HOST+'/addToChannel', {
      payload: {
        block: JSON.parse(viewingBlockProfile),
        channel: arr
      }
    }))
    // update default

    setViewingProfileDefaultValues(channels.map((channel: any) => {return {label: channel, value: channel}}))

    // gossip
    onlinePeers.map(async (peerID: any) => {
      console.log(await recentGossip(peerID, {
        author: sigil,
        source: JSON.parse(viewingBlockProfile).source,
        timestamp: Date.now(),
        vector: [], 
        title:  'a thingy',
        channel: arr[0]
      }))
    })
  }

  const handleOnchangeFromPreview  =  async (val: any)  => {

    const channels = val.split(',')
    const arr = channels.filter((x: any) => !viewingProfileDefaultValues.map((el: any) => el.value).includes(x))

    await axios.post(HOST+'/addToChannel', {
      payload: {
        block: viewingBlock,
        channel: arr
      }
    })
    // update default

    setViewingProfileDefaultValues(channels.map((channel: any) => {return {label: channel, value: channel}}))
    // gossip
    onlinePeers.map(async (peerID: any) => {
      console.log(await recentGossip(peerID, {
        author: sigil,
        source: viewingBlock.raw.source,
        timestamp: Date.now(),
        vector: [], 
        title:  'a thingy',
        channel: arr[0]
      }))
    })

  }

  const [newChannelName, changeNewChannelName] = useState(null)
  useEffect(() => {

  },[profilePreviews])

  
  const addToChannelComplete = async () => {
    console.log(newChannelName)
    setIsOpen(false)

    if(isGraph){
      console.log(isGraph)
      const re = await client.mutate({
              mutation: gql`
                mutation ExampleQuery($title: String) {
                  channel(title: $title) {
                    status
                  }
                }
              `,
              variables: {
                title: newChannelName
              }
            })

      const profilePreviewsRaw: any = []
      const res = await client
            .query({
              query: gql`
                query ExampleQuery {
                  preview {
                    files {
                      blockCount
                      id
                      preview {
                        raw {
                          connections
                          title
                          source
                        }
                      }
                    }
                  }
                }
              `,
            })

            res.data.preview.files.map((element: any) => {
            profilePreviewsRaw.push(
              <Row className="justify-content-md-center" style={{ border: '1px solid lightgrey',margin: '5px auto', padding: '10px',alignContent: 'center', fontFamily: 'Courier', width: '80%'}}>
                <Col  xs={3}><div onClick={() => setViewingChannel(element.id)} className='card-preview'>{element.id}<br/><br/><span style={{fontSize: '15px'}}>{element.blockCount} blocks</span></div></Col>
                <Col xs={3}>
                  {element.preview[0]&&<div className='card' onClick={() => setViewingBlock(element.preview[0])}>
                    <img style={{objectFit: 'contain', maxHeight: '100%',alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={element.preview[0].raw.source}/>
                  </div>}
                </Col>
                <Col xs={3}>
                  {element.preview[1]&&<div className='card' onClick={() => setViewingBlock(element.preview[1])}>
                    <img style={{objectFit: 'contain', maxHeight: '100%', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={element.preview[1].raw.source}/>
                  </div>}
                </Col>
                <Col xs={3}>
                  {element.preview[2]&&<div className='card' onClick={() => setViewingBlock(element.preview[2])}>
                    <img style={{objectFit: 'contain', maxHeight: '100%', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={element.preview[2].raw.source}/>
                  </div>}
                </Col>
              </Row>
            )
          })

        setProfilePreviews(profilePreviewsRaw)
        setNewPreview(newPreview + 1)
    } else{

      console.log(await axios.post(HOST + '/addChannel', {
      channelName: newChannelName
      }))
    setNewPreview(newPreview + 1)

    }
  }

  useEffect(() => {

    if(viewingBlock && isGraph){

      setTimeout(async () => {
        console.log(viewingBlock.raw.source)
        const res = await client
            .query({
              query: gql`
                query ExampleQuery($url: String) {
                  connections(url: $url) {
                    connections
                    totalChannels
                  }
                }
              `,
              variables: {
                url: viewingBlock.raw.source
              }
            })
            setViewingProfileDefaultValues(res.data.connections.connections.map((channel: any) => {return {label: channel, value: channel}}))
            setViewingProfileOptions(res.data.connections.totalChannels.map((channel: any) => {return {label: channel, value: channel}}))
      }, 0)

    } else if(viewingBlockProfile && isGraph) {
      console.log(viewingBlockProfile)
    }

    if(viewingBlock && !isGraph){ 
      setTimeout(async () => {
        const res = await axios.post(HOST + '/channel/connections/', {
          url: viewingBlock.raw.source
        })

        setViewingProfileDefaultValues(res.data.connections.map((channel: any) => {return {label: channel, value: channel}}))
        setViewingProfileOptions(res.data.totalChannels.map((channel: any) => {return {label: channel, value: channel}}))
      }, 0)
    }
    else if(viewingBlockProfile){
      setTimeout(async () => {
        console.log(viewingBlockProfile)
        const res = await axios.post(HOST + '/channel/connections/', {
          url: viewingBlockProfile.source
        })

        console.log(res.data)

        setViewingProfileDefaultValues(res.data.connections.map((channel: any) => {return {label: channel, value: channel}}))
        setViewingProfileOptions(res.data.totalChannels.map((channel: any) => {return {label: channel, value: channel}}))
      }, 0)
    }

  }, [viewingBlockProfile, viewingBlock, isGraph])

  const [viewingProfileDefaultValues, setViewingProfileDefaultValues] = useState([])
  const [viewingProfileOptions, setViewingProfileOptions] = useState(null)

  useEffect(() => {

  }, [viewingProfileOptions, setViewingProfileDefaultValues])

  const removeChannel = async () => {

    if(isGraph){
      await client.mutate({
              mutation: gql`
                mutation ExampleQuery($title: String) {
                  removeChannel(title: $title) {
                    status
                  }
                }
              `,
              variables: {
                title: viewingChannel
              }
            })

    }else {
      console.log(axios.post(HOST + "/" + 'removeChannel', {
        directory: viewingChannel
      }))
    }
    setViewingChannel(null)
  }

  return (
    <>
      <br/>
        {
          sigil ? 
            <>
                <div style={{position: 'fixed', top: '60px', right: '120px', cursor: 'pointer'}}>
                  <Sigil config={{
                   point: sigil,
                   size: 48,
                   background:'white', 
                   foreground:'black',
                   detail:'default',
                   space:'none',
                  }}/>
                </div>
                <div style={{alignContent: 'center', fontFamily: 'Courier', width: '100%',top: '50px', position: 'fixed', transform: 'translateX(-50%)'}}>
                <h4>stagi.um</h4>
                <br/>
                {
                  viewingBlock ? 
                    <>
                      <Container>
                        <div style={{position: 'fixed', top: '30px', left: '200px', cursor: 'pointer'}} onClick={() => {setViewingBlock(null);setViewingBlockProfile(null);}}>
                          {`< back`}
                        </div>
                        <Row className="justify-content-md-center">
                          <Col xs={6}>
                            <img className='card-view' style={{objectFit: 'contain', alignContent: 'center', marginTop: '40%', transform: 'translateY(-50%)'}} src={viewingBlock.raw.source}/>
                          </Col>
                          <Col xs={6}>
                            <div style={{position: 'relative', marginTop: '17vh', left: '50%', transform: 'translateX(-50%)'}}>
                            <h1>title</h1>
                            <p style={{width: '600px', overflowY:'scroll', maxHeight: '100px'}}>lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk</p>
                            <div style={{position: 'absolute', marginTop: '3vh', left: '50%', transform: 'translateX(-50%)'}}>
                                {viewingProfileOptions && <MultiSelect
                                  onChange={handleOnchangeFromPreview}
                                  defaultValue={viewingProfileDefaultValues}
                                  options={viewingProfileOptions}
                                /> }
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Container>
                    </>
                  : 
                    <>
                      <Tabs
                        onSelect={(value: any)=> {setViewingBlock(null);setViewingBlockProfile(null); setTab(value)}}
                        defaultActiveKey={tab}
                        id="fill-tab-example"
                        className="mb-4"
                        style={{width: '741px', margin: 'auto'}}
                        fill
                      >
                        <Tab eventKey="explore" title="explore">
                          <div>
                          <br/>
                            <Container >
                              <Row style={{overflowY: 'scroll', maxHeight: '500px', padding: '20px'}}>
                                {explore}
                              </Row>
                            </Container>
                          </div>
                        </Tab>
                        <Tab eventKey="feed" title="feed">
                            <Container fluid style={{overflowY: 'scroll', maxHeight: '500px', padding: '20px'}}>
                              {feed}
                            </Container>
                        </Tab>
                        <Tab eventKey="profile" title="profile">
                          {
                            !viewingChannel ? <Container fluid 
                              style={{overflowY: 'scroll', maxHeight: '500px', paddingLeft: '100px', paddingRight: '100px'}}
                            >
                              <Row className="justify-content-md-center">
                              <h4>learning progress</h4>
                                <Col xs={4}>
                                </Col>
                                <Col xs={4}>
                                <Sparklines data={learningLocal} width={100} height={30} margin={5}>
                                  <SparklinesReferenceLine type="mean" />
                                  <SparklinesLine color={learningLocal[0] < learningLocal[learningLocal.length-1] ? "blue" : "#dc2626"} />
                                </Sparklines>
                                <p>local</p>
                                </Col>
                                {/*<Col xs={4}>
                                  <Sparklines data={learningLocal.map(el => el*Math.random())} width={100} height={30} margin={5}>
                                  <SparklinesReferenceLine type="mean" />
                                  <SparklinesLine color={learningLocal[0] < learningLocal[learningLocal.length-1] ? "blue" : "#dc2626"} />
                                </Sparklines>
                                 

                                <p>community</p>
                                </Col>*/}
                                <Col></Col>
                              </Row>
                              <Row 
                              >
                              <br/>
                              <br/>
                              <hr style={{width: '900px', margin: 'auto'}}/>
                              <span>{/*<Button style={{margin: '10px', width: '180px'}} onClick={() => addToChannel()}>+ add channel</Button>*/}<Button style={{margin: '10px', width: '180px'}} onClick={() => {setTrainIncrement(trainIncrement+1);/*onlinePeers.map((peer: any) => train(peer))*/} }>{`^ train`}</Button></span>
                              <br/>
                              <br/>
                                {profilePreviews}
                              </Row>
                            </Container> 
                            : 
                              viewingBlockProfile ? 
                              <>
                                <Container>
                                  <div style={{position: 'fixed', top: '130px', left: '200px', cursor: 'pointer'}} onClick={() => {setViewingBlock(null);setViewingBlockProfile(null)}}>
                                    {`< back`}
                                  </div>

                                  <Row className="justify-content-md-center">
                                    <Col xs={6}>
                                      <img className='card-view' style={{objectFit: 'contain', alignContent: 'center', marginTop: '40%', transform: 'translateY(-50%)'}} src={viewingBlockProfile.source}/>
                                    </Col>
                                    <Col xs={6}>
                                      <div style={{position: 'relative', marginTop: '17vh', left: '50%', transform: 'translateX(-50%)'}}>
                                      <h1>title</h1>
                                      <p style={{width: '600px', overflowY:'scroll', maxHeight: '100px'}}>lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk</p>
                                      <div style={{position: 'absolute', marginTop: '3vh', left: '50%', transform: 'translateX(-50%)'}}>
                                        {viewingProfileOptions && <MultiSelect
                                          onChange={handleOnchange}
                                          defaultValue={viewingProfileDefaultValues}
                                          options={viewingProfileOptions}
                                        /> }
                                        </div>
                                      </div>
                                    </Col>
                                  </Row>
                                </Container>
                              </>
                            :
                            <>
                              <Container> 
                              <div style={{position: 'fixed', top: '130px', left: '200px', cursor: 'pointer'}} onClick={() => setViewingChannel(null)}>
                                  {`< back`}
                                </div>
                                <Row className="justify-content-md-center">

                                <h4>{viewingChannel}</h4>
                                </Row>
                                <Row 
                                >
                                <br/>
                                <br/>
                                <hr style={{width: '900px', margin: 'auto'}}/>
                                <span><Button style={{margin: '10px', width: '180px'}} onClick={() => removeChannel()}>- remove channel</Button></span>
                                <br/>
                                <br/>
                                <Container fluid>
                                <Row 
                                >
                                  {viewingChannelBlocks}
                                </Row>
                                </Container>

                                </Row>
                              </Container> 
                            </>
                        }
                        </Tab>
                      </Tabs>
                    </>
                  }
                <br/>
              </div>
              <Modal isOpen={modalIsOpen} style={customStyles} contentLabel="Example Modal">
                <Container>
                <Row className="justify-content-md-center">
                  <Col xs={3}>
                    <button onClick={()=>setIsOpen(false)}>close</button>
                  </Col>

                </Row>
                <br/>
                <br/>
                <Row className="justify-content-md-center">
                <br/>
                  <Col xs={6}>
                    <InputGroup >
                      <Form.Control
                        onChange={(evt: any) => changeNewChannelName(evt.target.value)}
                        placeholder="channel name"
                        aria-label="channel name"
                        aria-describedby="basic-addon1"
                      />
                    </InputGroup>
                  </Col>

                  <Col xs={6}>
                    <Button onClick={addToChannelComplete} style={{width: '150px'}}>+ add channel</Button>
                  </Col>
                </Row>
                </Container>
              </Modal>
            </>
          :
          <>
            <div style={{alignContent: 'center', fontFamily: 'Courier', width: '100%',top: '120px', position: 'fixed', transform: 'translateX(-50%)'}}>
                <h3>stagi.um</h3>
                <br/>
                <p>carry ur data</p>
                <p>$ docker run -it -v /Volumes/{'<usb_name>'}/files:/usr/src/app/files -p 3000:3000 -e DIRECTORY=files ronseg/stagi.um</p>
                <br/>
                <br/>
                <Button onClick={() => handleMetaMaskConnect()}>~ sign in</Button>
            </div>
          </>
        }
    </>
  )
}

export default App