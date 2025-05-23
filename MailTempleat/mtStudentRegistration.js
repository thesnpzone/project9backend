module.exports = function studentRegistrationEmail({ fullName, otp }) {
    return {
        subject: 'Your OTP for SkillHunt Student Registration',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #27428E;">SkillHunt Registration OTP</h2>
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>Thank you for initiating your registration on <strong>SkillHunt</strong>.</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #27428E; margin: 20px 0;">
          ${otp}
        </div>
        <p>Please use this OTP to continue your registration process. The OTP is valid for <strong>2 minutes</strong>.</p>
        <p>If you didn’t request this, you can ignore this email.</p>
        <br/>
        <p>Regards,</p>
        <p><strong>SkillHunt Team</strong></p>
        <p><strong>By SNP ZONE</strong></p>
      </div>
    `
    };
};