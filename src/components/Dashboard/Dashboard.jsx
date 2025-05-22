import Sidebar from "../Sidebar/Sidebar";
import Main from "../Main/Main";
import '../../index.css';

function Dashboard({ user }) {
  return (
    <>
      <Sidebar />
      <Main user={user} />
    </>
  );
}

export default Dashboard;
