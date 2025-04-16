import axios from 'axios';

// This file is a client-side placeholder for email functionality
// Most email functionality will be handled on the server side

const sendEmail = async (emailData) => {
  try {
    const response = await axios.post('/api/email/send', emailData);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || 'Failed to send email');
  }
};

export { sendEmail };
