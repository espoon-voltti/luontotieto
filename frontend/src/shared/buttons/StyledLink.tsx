import { colors } from 'shared/theme'
import styled from 'styled-components'

export const StyledLink = styled.a`
  font-weight: bold;

  &:focus {
    outline: 2px solid ${colors.main.m2Focus};
    outline-offset: 2px;
  }
`
