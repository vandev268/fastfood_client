const Config = {
  BaseUrl: 'http://localhost:4000',
  SocketUrl: 'http://localhost:4008',
  Timeout: 10000,
  LogoBaseUrl:
    'https://nestjs-ecommerce-clone.s3.ap-southeast-1.amazonaws.com/bases/09b79bf1-8dd9-4ca3-99e2-ea87281edb06.png',
  ImageBaseUrl:
    'https://nestjs-ecommerce-clone.s3.ap-southeast-1.amazonaws.com/bases/236998c8-9fe3-42f8-95fd-5a3d5247a681.png',
  NoProductImage:
    'https://nestjs-ecommerce-clone.s3.ap-southeast-1.amazonaws.com/bases/9a165b25-9c1b-4640-82dd-d3e247dab971.png',
  VNPayIamgeUrl:
    'https://nestjs-ecommerce-clone.s3.ap-southeast-1.amazonaws.com/bases/81130cb5-0511-45ea-8519-e6f563c51a0d.webp',
  MomoImageUrl:
    'https://nestjs-ecommerce-clone.s3.ap-southeast-1.amazonaws.com/bases/8307e6c3-d4c6-4c31-a071-d98009b7086a.webp',
  BaseTableUrl:
    'https://nestjs-ecommerce-clone.s3.ap-southeast-1.amazonaws.com/bases/9e500dc6-d3c3-4691-afe9-281f370434bd.png'
} as const

export default Config
