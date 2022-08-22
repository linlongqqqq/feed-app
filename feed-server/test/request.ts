import axios from 'axios'

const request = axios.create({
  baseURL: 'http://127.0.0.1:4014/api/v1',
  timeout: 6000,
})

export default request
