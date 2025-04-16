import styled from 'styled-components';

const StyledFooter = styled.footer`
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 0;
  text-align: center;
  margin-top: 2rem;
  
  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
  }
`;

const Footer = () => {
  return (
    <StyledFooter>
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} - Bataille Navale - UIK Tiaret TP Programmation Web</p>
        <p>Master 1 GL - Département Informatique</p>
      </div>
    </StyledFooter>
  );
};

export default Footer;
