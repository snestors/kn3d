import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}&email=${email}`
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 KN3D</h1>
          <p>¡Bienvenido a KN3D!</p>
        </div>
        <div class="content">
          <h2>Verifica tu cuenta</h2>
          <p>¡Hola! Gracias por registrarte en KN3D, tu tienda especializada en impresión 3D.</p>
          <p>Para completar tu registro y activar tu cuenta, necesitas verificar tu dirección de correo electrónico.</p>
          
          <div style="text-align: center;">
            <a href="${verifyUrl}" class="button">✅ Verificar Email</a>
          </div>
          
          <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
          <p style="background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all;">
            ${verifyUrl}
          </p>
          
          <p><strong>⏰ Este enlace expira en 24 horas.</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p>Una vez verificado, podrás:</p>
          <ul>
            <li>🛒 Realizar compras en nuestra tienda</li>
            <li>📦 Hacer seguimiento a tus pedidos</li>
            <li>💾 Guardar productos favoritos</li>
            <li>🔔 Recibir ofertas exclusivas</li>
          </ul>
        </div>
        <div class="footer">
          <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
          <p>&copy; 2024 KN3D - Tu partner en impresión 3D</p>
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
Bienvenido a KN3D!

Gracias por registrarte en KN3D, tu tienda especializada en impresión 3D.

Para completar tu registro y activar tu cuenta, necesitas verificar tu dirección de correo electrónico.

Verifica tu email visitando: ${verifyUrl}

Este enlace expira en 24 horas.

Una vez verificado, podrás:
- Realizar compras en nuestra tienda
- Hacer seguimiento a tus pedidos  
- Guardar productos favoritos
- Recibir ofertas exclusivas

Si no creaste esta cuenta, puedes ignorar este email.

© 2024 KN3D - Tu partner en impresión 3D
  `

  try {
    await transporter.sendMail({
      from: `"KN3D" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '✅ Verifica tu cuenta en KN3D',
      text: textContent,
      html: htmlContent,
    })
    console.log(`Verification email sent to ${email}`)
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 ¡Cuenta Verificada!</h1>
          <p>KN3D - Impresión 3D</p>
        </div>
        <div class="content">
          <h2>¡Hola ${name}!</h2>
          <p>¡Excelente! Tu cuenta ha sido verificada exitosamente. Ya puedes disfrutar de todos los beneficios de KN3D.</p>
          
          <h3>🚀 ¿Qué puedes hacer ahora?</h3>
          <ul>
            <li>🧵 Explorar nuestro catálogo de filamentos premium</li>
            <li>🧪 Descubrir las mejores resinas para impresión</li>
            <li>🖨️ Ver nuestras impresoras 3D recomendadas</li>
            <li>🔧 Encontrar accesorios y herramientas</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/products" class="button">🛒 Explorar Productos</a>
          </div>
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4>💡 Ofertas de Bienvenida:</h4>
            <p>• 🚚 <strong>Envío gratis</strong> en compras mayores a S/ 200</p>
            <p>• 📞 <strong>Soporte técnico</strong> especializado</p>
            <p>• 🔔 <strong>Notificaciones</strong> de nuevos productos y ofertas</p>
          </div>
        </div>
        <div class="footer">
          <p>¡Gracias por confiar en KN3D!</p>
          <p>&copy; 2024 KN3D - Tu partner en impresión 3D</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"KN3D" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '🎉 ¡Bienvenido a KN3D! Tu cuenta está lista',
      html: htmlContent,
    })
    return true
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return false
  }
}