import { Outlet } from 'react-router-dom';
import Footer from '../Common/Footer';
import Header from '../Common/Header';

const UserLayout = () => {
  return (
    <>
        {/*Header*/}
        <Header />
        {/* Main content */}
        <main className='min-h-[70vh]'>
          <Outlet />
          <div className="fixed bottom-4 right-4">
          </div>
        </main>
            {/* Chatbot xuất hiện ở góc màn hình */}

        {/* Footer */}
        <Footer />
    </> 
  )
}

export default UserLayout