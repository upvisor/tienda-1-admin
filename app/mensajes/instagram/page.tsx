"use client"
import { MessagesCategories, Spinner } from '@/components/ui'
import { IInstagramId, IInstagramMessage } from '@/interfaces/'
import axios from 'axios'
import Head from 'next/head'
import React, { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'

const socket = io(`${process.env.NEXT_PUBLIC_API_URL}`)

export default function Page () {
  
  const [instagramIds, setInstagramIds] = useState<IInstagramId[]>()
  const [messages, setMessages] = useState<IInstagramMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedInstagramId, setSelectedInstagramId] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef(messages)
  const selectedInstagramIdRef = useRef(selectedInstagramId)

  const getMessages = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/instagram`)
    setInstagramIds(response.data)
  }

  useEffect(() => {
    getMessages()
  }, [])

  useEffect(() => {
    const interval = setInterval(getMessages, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    selectedInstagramIdRef.current = selectedInstagramId
  }, [selectedInstagramId])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  useEffect(() => {
    socket.on('instagram', async (message) => {
      if (selectedInstagramIdRef.current === message.instagramId) {
        setMessages(messagesRef.current.concat([{ instagramId: message.instagramId, message: message.message, agent: true, view: true, createdAt: new Date() }]))
      }
    })

    return () => {
      socket.off('instagram', message => console.log(message))
    }
  }, [])
  
  return (
    <>
      <Head>
        <title>Mensajes</title>
      </Head>
        <div className='p-6 w-full min-h-full overflow-y-auto bg-[#f6f6f7] dark:bg-neutral-900'>
          <div className='w-full max-w-1280 m-auto mb-4'>
            <h1 className='text-xl mb-4'>Mensajes</h1>
            <MessagesCategories />
          </div>
          <div className='w-full max-w-1280 flex m-auto gap-6'>
            <div className='w-1/2 flex flex-col gap-2'>
              {
                instagramIds === undefined
                  ? (
                    <div className='mt-20 flex w-full'>
                      <div className='m-auto w-fit'>
                        <Spinner />
                      </div>
                    </div>
                  )
                  : instagramIds.length
                    ? instagramIds?.map(instagram => {
                      const createdAt = new Date(instagram.createdAt!)
                      return (
                        <button onClick={async () => {
                          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/instagram/${instagram.instagramId}`)
                          setMessages(response.data)
                          setSelectedInstagramId(instagram.instagramId)
                          await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/instagram/${instagram.instagramId}`)
                          getMessages()
                        }} key={instagram.instagramId} className={`${instagram.instagramId === selectedInstagramId ? 'bg-main/50' : 'bg-white dark:bg-neutral-700/60'}  w-full text-left transition-colors duration-150 flex gap-2 justify-between h-20 p-2 rounded-xl hover:bg-neutral-200/40 dark:hover:bg-neutral-700`}>
                          <div className='mt-auto mb-auto'>
                            <p>{instagram.instagramId}</p>
                            <p className='text-sm text-neutral-600 dark:text-neutral-400'>{createdAt.getDay()}/{createdAt.getMonth() + 1} {createdAt.getHours()}:{createdAt.getMinutes() < 10 ? `0${createdAt.getMinutes()}` : createdAt.getMinutes()}</p>
                          </div>
                          {
                            instagram.view === false
                              ? <div className=' mt-auto mb-auto w-3 h-3 rounded-full bg-main' />
                              : ''
                          }
                        </button>
                      )
                    })
                    : <p>No hay chats</p>
              }
            </div>
            <div className='w-1/2'>
              <div className='bg-white pt-4 pb-4 pl-4 flex flex-col gap-4 justify-between shadow-md rounded-xl w-full h-[70vh] dark:bg-neutral-700/60'>
                <div ref={containerRef} className='w-full h-full pr-4' style={{ overflow: 'overlay' }}>
                  {
                    messages?.map(message => {
                      const createdAt = new Date(message.createdAt!)
                      return (
                        <div key={message._id} className='flex flex-col gap-2 mb-2'>
                          {
                            message.message
                              ? (
                                <div className='bg-neutral-200 flex flex-col p-1.5 rounded-md w-fit text-black'>
                                  <p>{message.message}</p>
                                  <p className='text-sm text-neutral-600 dark:text-neutral-400'>{createdAt.getDay()}/{createdAt.getMonth() + 1} {createdAt.getHours()}:{createdAt.getMinutes() < 10 ? `0${createdAt.getMinutes()}` : createdAt.getMinutes()}</p>
                                </div>
                              )
                              : ''
                          }
                          {
                            message.response
                              ? (
                                <div className='bg-main flex flex-col text-white p-1.5 rounded-md w-fit ml-auto'>
                                  <p>{message.response}</p>
                                  <p className='text-sm ml-auto dark:text-neutral-400'>{createdAt.getDay()}/{createdAt.getMonth() + 1} {createdAt.getHours()}:{createdAt.getMinutes() < 10 ? `0${createdAt.getMinutes()}` : createdAt.getMinutes()}</p>
                                </div>
                              )
                              : ''
                          }
                        </div>
                      )
                    })
                  }
                </div>
                <form onSubmit={async (e: any) => {
                  e.preventDefault()
                  setMessages(messages.concat({instagramId: selectedInstagramId, response: newMessage, agent: true, view: false, createdAt: new Date()}))
                  const newMe = newMessage
                  setNewMessage('')
                  await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/instagram`, {instagramId: selectedInstagramId, response: newMe, agent: true, view: true})
                  getMessages()
                }} className='flex gap-2 pr-4'>
                  <input onChange={(e: any) => setNewMessage(e.target.value)} value={newMessage} type='text' placeholder='Escribe tu mensaje' className='border p-1.5 w-full rounded dark:border-neutral-600 focus:outline-none focus:border-main focus:ring-1 focus:ring-main' />
                  <button type='submit' className='bg-main border border-main text-white w-24 rounded transition-colors duration-200 hover:bg-transparent hover:text-main'>Enviar</button>
                </form>
              </div>
            </div>
          </div>
        </div>
    </>
  )
}