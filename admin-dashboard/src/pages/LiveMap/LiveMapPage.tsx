import React, { useEffect } from 'react';
import { Layout, List, Avatar, Badge, Card, Input } from 'antd';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const { Sider, Content } = Layout;

const LiveMapPage: React.FC = () => {
  const { data: employees, refetch } = useQuery({
    queryKey: ['live-locations'],
    queryFn: async () => {
      const response = await api.get('/location/live');
      return response.data.data.employees;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const getIcon = (isOnline: boolean) => {
    return L.divIcon({
      className: 'custom-icon',
      html: `<div style="background-color: ${isOnline ? '#52c41a' : '#f5222d'}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
    });
  };

  return (
    <Layout style={{ height: 'calc(100vh - 112px)', margin: -24 }}>
      <Sider width={300} theme="light" style={{ borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
        <div style={{ padding: 16 }}>
            <Input.Search placeholder="Search employees..." allowClear />
        </div>
        <List
          itemLayout="horizontal"
          dataSource={employees}
          renderItem={(emp: any) => (
            <List.Item style={{ cursor: 'pointer', padding: '12px 16px' }}>
              <List.Item.Meta
                avatar={<Avatar src={emp.image} icon={<Avatar />} />}
                title={emp.name}
                description={
                    <div>
                        <Badge status={emp.isOnline ? 'success' : 'error'} text={emp.isOnline ? 'Online' : 'Offline'} />
                        <span style={{ marginLeft: 8 }}>🔋 {emp.battery}%</span>
                    </div>
                }
              />
            </List.Item>
          )}
        />
      </Sider>
      <Content>
        <MapContainer center={[23.8103, 90.4125]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {employees?.map((emp: any) => (
            <Marker key={emp.id} position={[emp.latitude, emp.longitude]} icon={getIcon(emp.isOnline)}>
              <Popup>
                <strong>{emp.name}</strong><br />
                Last Seen: {new Date(emp.lastSeen).toLocaleTimeString()}<br />
                Battery: {emp.battery}%
              </Popup>
            </Marker>
          ))}
          {/* Geofence placeholder */}
          <Circle center={[23.8103, 90.4125]} radius={1000} pathOptions={{ color: 'red' }} />
        </MapContainer>
      </Content>
    </Layout>
  );
};

export default LiveMapPage;
