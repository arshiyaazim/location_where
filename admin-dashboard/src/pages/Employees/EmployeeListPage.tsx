import React, { useState } from 'react';
import { Table, Button, Space, Input, Tag, Card, Modal, Form, Select, message } from 'antd';
import { PlusOutlined, SearchOutlined, DownloadOutlined, HistoryOutlined, PhoneOutlined, ControlOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const EmployeeListPage: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees');
      return response.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/employees', values),
    onSuccess: () => {
      message.success('Employee added successfully');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });

  const columns = [
    { title: 'Code', dataIndex: 'employeeCode', key: 'code' },
    { title: 'Name', dataIndex: 'fullName', key: 'name' },
    { title: 'Branch', dataIndex: 'branchId', key: 'branch' },
    {
        title: 'Status',
        dataIndex: 'isActive',
        key: 'status',
        render: (active: boolean) => <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Tag>
    },
    {
        title: 'Consent',
        dataIndex: 'consentSigned',
        key: 'consent',
        render: (signed: boolean) => signed ? '✅' : '❌'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button icon={<HistoryOutlined />} title="History" />
          <Button icon={<PhoneOutlined />} title="Calls" />
          <Button icon={<ControlOutlined />} title="Remote" />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Employee Directory"
        extra={
            <Space>
                <Button icon={<DownloadOutlined />}>Export</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>Add Employee</Button>
            </Space>
        }
      >
        <Space style={{ marginBottom: 16 }}>
            <Input placeholder="Search name or code" prefix={<SearchOutlined />} allowClear />
            <Select placeholder="Filter by Branch" style={{ width: 200 }} allowClear>
                <Select.Option value="main">Main Branch</Select.Option>
                <Select.Option value="north">North Branch</Select.Option>
            </Select>
        </Space>
        <Table columns={columns} dataSource={employees} loading={isLoading} rowKey="id" />
      </Card>

      <Modal
        title="Add New Employee"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="employeeCode" label="Employee Code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="branchId" label="Branch">
            <Select>
                <Select.Option value="main">Main Branch</Select.Option>
                <Select.Option value="north">North Branch</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeListPage;
