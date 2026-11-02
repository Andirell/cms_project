import { Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout.jsx';
import PublicLayout from './components/PublicLayout.jsx';
import RequireAccess from './components/RequireAccess.jsx';
import Account from './pages/Account.jsx';
import Blog from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import Contact from './pages/Contact.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Projects from './pages/Projects.jsx';
import Services from './pages/Services.jsx';
import Team from './pages/Team.jsx';
import CompanyProfileAdmin from './pages/dashboard/CompanyProfile.jsx';
import InquiriesAdmin from './pages/dashboard/Inquiries.jsx';
import Overview from './pages/dashboard/Overview.jsx';
import PostsAdmin from './pages/dashboard/Posts.jsx';
import ProjectsAdmin from './pages/dashboard/Projects.jsx';
import ServicesAdmin from './pages/dashboard/Services.jsx';
import TeamAdmin from './pages/dashboard/Team.jsx';
import TestimonialsAdmin from './pages/dashboard/Testimonials.jsx';
import UsersAdmin from './pages/dashboard/Users.jsx';

function companyEditorsOnly(page) {
  return <RequireAccess permission="can_edit_company_content">{page}</RequireAccess>;
}

function adminsOnly(page) {
  return <RequireAccess permission="can_manage_users">{page}</RequireAccess>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/team" element={<Team />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<RequireAccess><Account /></RequireAccess>} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/dashboard"
        element={<RequireAccess permission="can_edit_projects_and_blog"><DashboardLayout /></RequireAccess>}
      >
        <Route index element={<Overview />} />
        <Route path="projects" element={<ProjectsAdmin />} />
        <Route path="posts" element={<PostsAdmin />} />
        <Route path="services" element={companyEditorsOnly(<ServicesAdmin />)} />
        <Route path="team" element={companyEditorsOnly(<TeamAdmin />)} />
        <Route path="testimonials" element={companyEditorsOnly(<TestimonialsAdmin />)} />
        <Route path="inquiries" element={companyEditorsOnly(<InquiriesAdmin />)} />
        <Route path="company" element={adminsOnly(<CompanyProfileAdmin />)} />
        <Route path="users" element={adminsOnly(<UsersAdmin />)} />
      </Route>
    </Routes>
  );
}
