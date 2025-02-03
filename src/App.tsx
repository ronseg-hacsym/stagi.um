import { useState, useEffect } from 'react'

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

import { Fluence, kras } from '@fluencelabs/js-client'
import { recentGossip, registerStagium, train} from './fluence/main'

import { io } from "socket.io-client";

import Tab from 'react-bootstrap/Tab';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import Tabs from 'react-bootstrap/Tabs';

import MultiSelect from  'react-multiple-select-dropdown-lite'
import  'react-multiple-select-dropdown-lite/dist/index.css'
import { Sparklines, SparklinesLine, SparklinesReferenceLine} from 'react-sparklines';

import './App.css'

import 'bootstrap/dist/css/bootstrap.min.css';

import '@urbit/sigil-js'

const config = {
 point: '~ronseg-hacsym',
 size: 48,
 background:'white', 
 foreground:'black',
 detail:'default',
 space:'none',
}

const configSmall = {
 point: '~ronseg-hacsym',
 size: 25,
 background:'white', 
 foreground:'black',
 detail:'default',
 space:'none',
}

const Sigil = ({ config }) => {
 return (
   <urbit-sigil {...config} />
 )
}

const SigilSmall = ({ config }) => {
  return(
    <span style={{marginBottom: '-20px', position: 'absolute'}}>
       <urbit-sigil {...config} />
    </span>
  )
}

const onlinePeers = []
let socketID: any = null

const populateFeed = () => {
  const array = []
  const channels = ['Compute', 'Graphs', 'Sky']
  const TWENTY_HOURS = 20 * 60 * 60 * 1000;
  for(let i = 0; i < 30; i++){
    array.push({
      channel: channels[Math.round(Math.random()*3)],
      source: 'https://images.unsplash.com/photo-1735580825884-5b7ad8b5e551?q=80&w=2938&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      timestamp: Math.round(Date.now() - TWENTY_HOURS*Math.random())
    })
  }

  array.sort((a,b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return array
}

function App() {
  const [tab, setTab] = useState('feed')
  const [explore, setExplore] = useState<any>([])
  const [feed, setFeed] = useState<any>([])
  const [profilePreviews, setProfilePreviews] = useState<any>([])
  const [viewingBlock, setViewingBlock] = useState<any>(null)

  const profileImages = [
  {
    title: 'Compute',
    preview: [1,2,3]
  },{
    title: 'Graphs',
    preview: [1,2,3]
  },{
    title: 'Sky',
    preview: [1,2,3]
  },
  ]

  const images = [
    1,2,3,4,5,6,7,8,9,10,
    1,2,3,4,5,6,7,8,9,10,
    1,2,3,4,5,6,7,8,9,10,
    1,2,3,4,5,6,7,8,9,10,
  ]

  useEffect(() => {
    
    setTimeout(async () => {
      await Fluence.connect(kras[0],
        {
          debug: { printParticleId: true },
        }
      )

      registerStagium({
        train: () => {
          console.log('time to train')
          return true
        }, 
        isOnlineCheck: () => {
          console.log('is online')
          return true
        }, 
        recentGossip: (feedBlock: any) => {
          console.log(feedBlock)
          return true
        }
      })

      const peerID = await Fluence.getClient().getPeerId()
      console.log(peerID)

      const socket = io("http://localhost:3000");

      socket.on("connect", () => {
        socket.emit('peer-added', {peerID: peerID})
        console.log(socket.id); 
        socketID = socket.id
      });

      socket.on('peer-broadcast', (packet: any) => {
          onlinePeers.push(packet)
          console.log(packet)
      })

      socket.on('online-broadcast', (packet: any) => {
          console.log(packet)
          console.log(socketID)
          socket.emit('online-broadcast', socketID)
      })
    }, 0)
    return () => []
  }, [])

  useEffect(() => {
    let feedImages = populateFeed()
    const set = new Set()

    feedImages.map((el: any) => {
      if(el.channel) set.add(el.channel)
    })

    const channels = Array.from(set)
    const feedInChannels = channels.map((channel: any) => feedImages.filter((el: any) => el.channel == channel))

    setExplore(feedImages.map((el: any) => {
      return <Col xs={2}><div className='card' onClick={() => setViewingBlock(el)}>
          <img style={{objectFit: 'contain', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={el.source}/>
        </div></Col>
    }))

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
            <img style={{objectFit: 'contain', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={feedImages[i].source}/>
          </div>
          </Col>
        )

        for(j = i + 1; j < feedImages.length; j++){
          const HOURS = (batch)*4 * 60 * 60 * 1000;
          if((Date.now()) - feedImages[j].timestamp < HOURS){
            row.push(
              <Col xs={3}><div className='card' onClick={() => setViewingBlock(feedImages[j])}>

                <img style={{objectFit: 'contain', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src={feedImages[j].source}/>
                </div>
              </Col>
            )

            if((j+1) >= feedImages.length){
               feedImagesBatched.push(
                {
                  time: feedImages[j].timestamp,
                  element: <Row className="justify-content-md-center" style={{margin: 'auto', alignContent: 'center', fontFamily: 'Courier', width: '100%'}}>
                    
                    <Row className="justify-content-md-center" style={{margin: 'auto', alignContent: 'center', fontFamily: 'Courier', width: '100%'}}>
                      <span style={{position: 'relative', bottom: '10px', left: '5px'}}><SigilSmall config={configSmall}/>&nbsp;&nbsp;&nbsp;~ronseg-hacsym added {row.length} blocks to {feedImages[j].channel}</span>
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
                  <span style={{position: 'relative', bottom: '10px', left: '5px'}}><SigilSmall config={configSmall}/>&nbsp;&nbsp;&nbsp;~ronseg-hacsym added {row.length} blocks to {feedImages[j].channel}</span>
                </Row>
                {row}
              </Row>
            })
            break
          }
        }
      }
    }

    feedImagesBatched.sort((a,b) => {
      return new Date(b.time) - new Date(a.time);
    });

    setFeed(feedImagesBatched.map((el) => el.element))

    setProfilePreviews(profileImages.map((profileView: any) => {
      return <Row className="justify-content-md-center" style={{ border: '1px solid lightgrey',margin: '5px auto', padding: '10px',alignContent: 'center', fontFamily: 'Courier', width: '80%'}}>
      <Col xs={3}><div className='card-preview'>{profileView.title}<br/><br/><span style={{fontSize: '15px'}}>{Math.floor(Math.random()*300)} blocks</span></div></Col>
      <Col xs={3}>
        <div className='card' onClick={() => setViewingBlock(profileView)}>
          <img style={{objectFit: 'contain', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src="https://images.unsplash.com/photo-1735580825884-5b7ad8b5e551?q=80&w=2938&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"/>
        </div>
      </Col>
      <Col xs={3}>
        <div className='card' onClick={() => setViewingBlock(profileView)}>
          <img style={{objectFit: 'contain', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src="https://images.unsplash.com/photo-1735580825884-5b7ad8b5e551?q=80&w=2938&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"/>
        </div>
      </Col>
      <Col xs={3}>
        <div className='card' onClick={() => setViewingBlock(profileView)}>
          <img style={{objectFit: 'contain', alignContent: 'center', marginTop: '50%', transform: 'translateY(-50%)'}} src="https://images.unsplash.com/photo-1735580825884-5b7ad8b5e551?q=80&w=2938&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"/>
        </div>
      </Col>
      </Row>
    }))
  }, [])

  const asset = {
    sparklineData: [4,3,5,3,5,6,7]
  }

  const handleOnchange  =  val  => {
    onlinePeers.map(async (peerID: any) => {
      console.log(await recentGossip(peerID, {
        author: '~ronseg-hacsym',
        source: 'hihi',
        timestamp: Date.now(),
        description: 'wave', 
        title:  'a thingy',
        channel: val
      }))
    })
  }

  const  options  = [
    { label:  'Option 1', value:  'option_1'  },
    { label:  'Option 2', value:  'option_2'  },
    { label:  'Option 3', value:  'option_3'  },
    { label:  'Option 4', value:  'option_4'  },
  ]

  return (
    <>
      <br/>
      <div style={{position: 'fixed', top: '60px', right: '120px', cursor: 'pointer'}}>
        <Sigil config={config}/>
      </div>
      <div style={{alignContent: 'center', fontFamily: 'Courier', width: '100%',top: '50px', position: 'fixed', transform: 'translateX(-50%)'}}>
    <h4>stagi.um</h4>
    <br/>
    {viewingBlock ? 
      <>
        <Container>
          <div style={{position: 'fixed', top: '30px', left: '200px', cursor: 'pointer'}} onClick={() => setViewingBlock(null)}>
            {`< back`}
          </div>
          <Row className="justify-content-md-center">
            <Col xs={6}>
              <img className='card-view' style={{objectFit: 'contain', alignContent: 'center', marginTop: '40%', transform: 'translateY(-50%)'}} src="https://images.unsplash.com/photo-1735580825884-5b7ad8b5e551?q=80&w=2938&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"/>
            </Col>
            <Col xs={6}>
              <div style={{position: 'relative', marginTop: '17vh', left: '50%', transform: 'translateX(-50%)'}}>
              <h1>title</h1>
              <p style={{width: '600px', overflowY:'scroll', maxHeight: '100px'}}>lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk lorrm ipsum sdk asdflasdf asdflkasdf asdlfka asldkf asdfasdf apsdf plkajsdf laskdf sld asdlfk</p>
              <div style={{position: 'absolute', marginTop: '3vh', left: '50%', transform: 'translateX(-50%)'}}>
                <MultiSelect
                  onChange={handleOnchange}
                  options={options}
                />
                </div>
              </div>
            </Col>
          </Row>
        </Container>
        </>
        : <>
          <Tabs
          onSelect={(value: any)=> setTab(value)}
        defaultActiveKey={tab}
        id="fill-tab-example"
        className="mb-4"
        style={{width: '741px', margin: 'auto'}}
        fill
      >
        <Tab eventKey="explore" title="explore" onChange={{}}>
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
          <Container fluid 
            style={{overflowY: 'scroll', maxHeight: '500px', paddingLeft: '100px', paddingRight: '100px'}}
          >
            <Row className="justify-content-md-center">
            <h4>learning progress</h4>
              <Col xs={2}>
              </Col>
              <Col xs={4}>
              <Sparklines data={asset.sparklineData} width={100} height={30} margin={5}>
                <SparklinesReferenceLine type="mean" />
                <SparklinesLine color={asset.sparklineData[0] < asset.sparklineData[asset.sparklineData.length-1] ? "blue" : "#dc2626"} />
              </Sparklines>
              <p>local</p>
              </Col>
              <Col xs={4}>
                <Sparklines data={asset.sparklineData.map(el => el*Math.random())} width={100} height={30} margin={5}>
                <SparklinesReferenceLine type="mean" />
                <SparklinesLine color={asset.sparklineData[0] < asset.sparklineData[asset.sparklineData.length-1] ? "blue" : "#dc2626"} />
              </Sparklines>
              <p>global</p>
              </Col>
              <Col></Col>
            </Row>
            <Row 
            >
            <br/>
            <br/>
            <hr style={{width: '900px', margin: 'auto'}}/>
            <span><Button style={{margin: '10px', width: '180px'}} >+ add channel</Button><Button style={{margin: '10px', width: '180px'}} onClick={() => onlinePeers.map((peer: any) => train(peer)) }>{`^ train`}</Button></span>
            <br/>
            <br/>
              {profilePreviews}
            </Row>
          </Container>
        </Tab>
      </Tabs>
        </>
      }
      <br/>
    </div>
    </>
  )
}

export default App