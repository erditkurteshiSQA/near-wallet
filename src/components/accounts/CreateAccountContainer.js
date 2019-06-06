import React from 'react'
import PropTypes from 'prop-types'
import { Container, Loader, Grid, Dimmer, Header } from 'semantic-ui-react'

import { parse } from 'query-string'

import Disclaimer from '../common/Disclaimer'
import NearInfo from './NearInfo'

import styled from 'styled-components'

const CustomContainer = styled(Container)`

   &&& .page-title {
      padding-right: 0px;
      padding-top: 48px;
      padding-bottom: 0px;

      .column {
         padding: 0 14px 24px 0;
      }
      h1 {
         line-height: 48px;
      }
      .add {
      }
   }

   @media screen and (max-width: 767px) {
      &&& .page-title {
         padding-top: 14px;
         text-align: center;

         .column {
            padding: 0 0 6px 0;
         }
         h1 {
            margin-bottom: 0px;
         }
         h2 {
            font-size: 16px !important;
            line-height: 22px !important;
            color: #999 !important;
         }
         .column.add {
            text-align: left;
            padding-top: 0px !important;
         }
      }
   }
`

const CreateAccountContainer = ({ loader, children, location }) => (
   <CustomContainer>
      <Grid stackable>
         <Dimmer inverted active={loader}>
            <Loader />
         </Dimmer>

         <Grid.Row columns='2' className='page-title'>
            <Grid.Column>
               <h1>Create Account</h1>
               <h2>
                  Creating a NEAR account is easy. Just choose a username and
                  you’re ready to go.
               </h2>
               {parse(location.search).reset_accounts && (
                  <Header as='h3' className='color-blue'>
                     You have been redirected to this page because we had to
                     reset the developer accounts. Please create a new account.
                     We apologize for the inconveience.
                  </Header>
               )}
            </Grid.Column>
            <Grid.Column className='add'>
               <NearInfo />
            </Grid.Column>
         </Grid.Row>
      </Grid>

      {children}

      <Disclaimer />
   </CustomContainer>
)

CreateAccountContainer.propTypes = {
   loader: PropTypes.bool.isRequired,
   children: PropTypes.element.isRequired,
   location: PropTypes.object.isRequired
}

export default CreateAccountContainer