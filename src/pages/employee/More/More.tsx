import { useState } from 'react'
import Setting from './Setting'
import Account from './Account'
import ProfileForm from './ProfileForm'
import ChangePassword from './ChangePassword'

export default function More() {
  const [view, setView] = useState<'profile' | 'changePassword'>('profile')

  return (
    <div className='min-h-screen bg-background p-4 md:p-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='grid grid-cols-1 lg:grid-cols-10 gap-6'>
          {view === 'profile' ? <ProfileForm /> : <ChangePassword />}

          <div className='lg:col-span-3'>
            <div className='space-y-6'>
              <Account />

              <Setting view={view} setView={setView} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
